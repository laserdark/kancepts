import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Panel,
  Button,
} from 'react-bootstrap'

import {
  allExpedIdList,
  formatTime,
  expedInfoList,
} from '../../exped-info'

import {
  plannerUISelector,
} from '../../selectors'

import {
  mapDispatchToProps,
} from '../../store/reducer/ui/planner'

import { PTyp } from '../../ptyp'

import { presets } from '../../exped-info/presets'

class ControlImpl extends Component {
  static propTypes = {
    planner: PTyp.object.isRequired,
    modifyPlanner: PTyp.func.isRequired,
  }

  handleToggleExped = id => () => {
    const {modifyPlanner} = this.props
    modifyPlanner(planner => ({
      ...planner,
      expedFlags: {
        ...planner.expedFlags,
        [id]: !planner.expedFlags[id],
      },
    }))
  }

  handleApplyPreset = ids => () => {
    const {modifyPlanner} = this.props
    modifyPlanner(planner => ({
      ...planner,
      expedFlags: _.fromPairs(
        allExpedIdList.map(id =>
          [id, ids.includes(id)])),
    }))
  }

  render() {
    const ctrlRowStyle = {
      display: 'flex',
      alignItems: 'stretch',
    }

    const panelStyle = {
      marginTop: 10,
      marginBottom: 0,
      marginLeft: 8,
    }

    const {planner} = this.props
    const {expedFlags} = planner

    return (
      <div className="planner-control-panels">
        <div style={ctrlRowStyle}>
          <Panel
            style={{
              ...panelStyle,
              width: '80%',
            }}
            header="Expeditions"
          >
            <div style={{
              display: 'flex',
              padding: '4px 2px',
              justifyContent: 'space-between',
            }}>
              {

                _.chunk(allExpedIdList,8).map((expedIds,ind) => {
                  const world = ind+1
                  return (
                    <div
                      key={world}
                      style={{width: '19%', marginRight: 2, marginLeft: 2}}
                    >
                      {
                        expedIds.map(expedId => {
                          const info =
                            expedInfoList.find(i => i.id === expedId)
                          const flag = expedFlags[expedId]
                          return (
                            <Button
                              key={expedId}
                              bsStyle={flag ? 'success' : 'default'}
                              bsSize="small"
                              onClick={this.handleToggleExped(expedId)}
                              block>
                              <div style={{
                                width: '100%',
                                display: 'flex', alignItems: 'baseline'}}>
                                <div
                                  style={{
                                    flex: 1,
                                    textAlign: 'left',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    paddingRight: '0.2em',
                                  }}
                                >
                                  {`${expedId} ${info.name}`}
                                </div>
                                <div style={{
                                  alignSelf: 'flex-right',
                                  textAlign: 'right'}}>
                                  {formatTime(info.time)}
                                </div>
                              </div>
                            </Button>
                          )
                        })
                      }
                    </div>
                  )
                })
              }
            </div>
          </Panel>
          <Panel
            style={{
              ...panelStyle,
              width: '20%',
            }}
            header="Presets"
          >
            <div>
              {
                presets.map((preset,ind) => (
                  <Button
                    block
                    onClick={this.handleApplyPreset(preset.ids)}
                    bsSize="small"
                    key={
                      // eslint-disable-next-line react/no-array-index-key
                      ind
                    }
                  >
                    {preset.name}
                  </Button>
                ))
              }
            </div>
          </Panel>
        </div>
        <div style={ctrlRowStyle}>
          <Panel
            style={{
              ...panelStyle,
              flex: 3,
            }}
            header="Priority"
          >
            Resource Priority
          </Panel>
          <Panel
            style={{
              ...panelStyle,
              flex: 1,
            }}
            header="AFK Time"
          >
            AFK Time
          </Panel>
          <Panel
            style={{
              ...panelStyle,
              flex: 1,
            }}
            header="Fleets"
          >
            Available fleets
          </Panel>
        </div>
      </div>
    )
  }
}

const Control = connect(
  state => {
    const planner = plannerUISelector(state)
    return {planner}
  },
  mapDispatchToProps,
)(ControlImpl)

export {
  Control,
}
