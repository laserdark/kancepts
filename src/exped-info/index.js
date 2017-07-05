import _ from 'lodash'

import {
  allExpedIdList,
  resourceProperties,
} from './common'

import { $missions } from '../master-data'
import expedInfoListRaw from '../assets/exped-info.json'

import { minimalFleetCompos, atLeast, applyWildcard } from './fleet-compo'

// f(<value>,<resource prooerty>,<resource structure>)
const onResourceValue = f => resource =>
  _.fromPairs(resourceProperties.map(rp => [rp, f(resource[rp], rp, resource)]))

// we compute a function that can be later applied on a number,
// rather than compute a numeric factor.
// because we can preserve more precision this way
// (as 1.5*1.2=1.79999... but 300*1.5*1.2 works as expected)
const modifierToFunc = modifier => {
  if (modifier.type === 'standard') {
    const {gs, daihatsu} = modifier
    const gsFactor = gs ? 1.5 : 1
    const dlcFactor = 1 + Math.min(0.2, daihatsu*0.05)
    return v => Math.floor(v*gsFactor*dlcFactor)
  }
  if (modifier.type === 'custom') {
    return v => Math.floor(v * modifier.value)
  }
  console.error(`Unexpected modifier type: ${modifier.type}`)
}

const applyIncomeModifier = modifier => {
  const func = modifierToFunc(modifier)
  return onResourceValue(func)
}

/*
   computeResupplyCost(<cost config>)(<exped info>,<costModelPartial>) =>

   {
     cost: null or {fuel, ammo}
     compo: null (for custom) or a fleet composition without 'any' ship type
   }

   costModelPartial is costModel applied with cost percentages

 */
const computeResupplyInfo = costConfig => {
  if (costConfig.type === 'cost-model') {
    const {wildcard, count} = costConfig
    return (expedInfo, costModelPartial) => {
      const {minCompo} = expedInfo
      // composition that satisfies user-specified length
      const abstractCompo = atLeast(count)(minCompo)
      const compo = applyWildcard(wildcard)(abstractCompo)
      const cost = _.toPairs(compo).reduce(
        (curCost, [stype,cnt]) => {
          if (curCost === null)
            return null
          const actualCost = costModelPartial(stype,cnt)
          if (actualCost === null)
            return null
          return {
            fuel: curCost.fuel + actualCost.fuelCost,
            ammo: curCost.ammo + actualCost.ammoCost,
          }
        },
        {fuel: 0, ammo: 0})
      return {
        cost,
        compo,
      }
    }
  }
  if (costConfig.type === 'custom') {
    const {fuel, ammo} = costConfig
    const cost = {fuel,ammo}
    return () => ({cost, compo: null})
  }
  console.error(`Unexpected cost config type: ${costConfig.type}`)
}

const itemIdToName = x =>
    x === 0 ? null
  : x === 1 ? 'bucket'
  : x === 2 ? 'instant-build'
  : x === 3 ? 'dev-mat'
  : x === 10 ? 'coin-small'
  : x === 11 ? 'coin-medium'
  : x === 12 ? 'coin-large'
  : console.error(`unknown item id: ${x}`)

const expedInfoList = expedInfoListRaw.map(raw => {
  const id = raw.api_id
  const $mission = $missions[id]
  const name = $mission.api_name
  const time = $mission.api_time
  const [fuel,ammo,steel,bauxite] = raw.resource
  const fromRawItem = ([itmId, itmCnt]) =>
    ({name: itemIdToName(itmId), maxCount: itmCnt})

  const itemProb = fromRawItem($mission.api_win_item1)
  const itemGS = fromRawItem($mission.api_win_item2)
  const fuelPercent = Math.round($mission.api_use_fuel * 100)
  const ammoPercent = Math.round($mission.api_use_bull * 100)
  const minCompo = minimalFleetCompos[id]
  return {
    id, name, time,
    resource: {fuel, ammo, steel, bauxite},
    // itemProb: item obtainable randomly from expedition
    // itemGS: guaranteed item if great success is achieved
    itemProb, itemGS,
    minCompo,
    cost: {fuelPercent, ammoPercent},
  }
})

const formatTime = minutes => {
  const mm = minutes % 60
  const hh = Math.round((minutes - mm) / 60)
  const mmText = _.padStart(mm, 2, '0')
  const hhText = _.padStart(hh, 2, '0')
  return `${hhText}:${mmText}`
}

export {
  allExpedIdList,
  expedInfoList,
  resourceProperties,
  onResourceValue,
  applyIncomeModifier,
  computeResupplyInfo,
  formatTime,
}
