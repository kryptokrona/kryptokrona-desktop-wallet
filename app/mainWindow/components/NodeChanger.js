// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { remote, ipcRenderer } from 'electron';
import { il8n, eventEmitter, session, configManager } from '../index';
import { uiType } from '../utils/utils';

type Props = {
  darkMode: boolean
};

type State = {
  connectionString: string,
  nodeChangeInProgress: boolean,
  ssl: boolean
};

export default class NodeChanger extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      connectionString:
        `${session.getDaemonConnectionInfo().host}:${
          session.getDaemonConnectionInfo().port
        }` || 'Connecting, please wait...',
      nodeChangeInProgress: false,
      ssl: session.getDaemonConnectionInfo().ssl || false
    };
    this.changeNode = this.changeNode.bind(this);
    this.resetConnectionString = this.resetConnectionString.bind(this);
    this.handleNewNode = this.handleNewNode.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('gotDaemonConnectionInfo', this.handleNewNode);
  }

  componentWillUnmount() {
    eventEmitter.off('gotDaemonConnectionInfo', this.handleNewNode);
  }

  resetConnectionString = () => {
    this.setState({
      connectionString: `${session.getDaemonConnectionInfo().host}:${
        session.getDaemonConnectionInfo().port
      }`,
      nodeChangeInProgress: false,
      ssl: session.getDaemonConnectionInfo().ssl
    });
  };

  changeNode = () => {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined
    });
    const { connectionString } = this.state;
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    // eslint-disable-next-line prefer-const
    let [host, port] = connectionString.split(':', 2);
    if (port === undefined) {
      port = 11898;
    }
    /* if the daemon entered is the same as the
    one we're connected to, don't do anything */
    if (
      host.trim() === session.getDaemonConnectionInfo().host &&
      port.trim() === String(session.getDaemonConnectionInfo().port)
    ) {
      this.resetConnectionString();
      return;
    }
    if (!Number.isNaN(parseInt(port, 10))) {
      const request = { host, port: parseInt(port, 10) };
      configManager.modifyConfig('daemonHost', host);
      configManager.modifyConfig('daemonPort', parseInt(port, 10));
      ipcRenderer.send('fromFrontend', 'changeNode', request);
    } else {
      this.resetConnectionString();
      const modalMessage = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Port number must be an integer!
          </p>
        </div>
      );
      eventEmitter.emit('openModal', modalMessage, 'OK', null, null);
    }
  };

  findNode = () => {
    remote.shell.openExternal('https://blocksum.org/nodes.html');
  };

  handleNewNode = () => {
    this.resetConnectionString();
  };

  render() {
    const { darkMode } = this.props;
    const { textColor, linkColor } = uiType(darkMode);
    const { nodeChangeInProgress, connectionString, ssl } = this.state;
    return (
      <div>
        <p className={`has-text-weight-bold ${textColor}`}>
          Remote Node (node:port)
        </p>
        <div className="field has-addons is-expanded">
          <div className="control is-expanded has-icons-left">
            {nodeChangeInProgress === false && (
              <input
                className="input has-icons-left"
                type="text"
                value={connectionString}
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    this.changeNode();
                  }
                }}
                onChange={event => {
                  this.setState({
                    connectionString: event.target.value.trim()
                  });
                }}
              />
            )}
            {ssl === true && (
              <span className="icon is-small is-left">
                <i className="fas fa-lock" />
              </span>
            )}
            {ssl === false && (
              <span className="icon is-small is-left">
                <i className="fas fa-unlock" />
              </span>
            )}
            {nodeChangeInProgress === true && (
              <input
                className="input"
                type="text"
                placeholder="connecting..."
              />
            )}
            {nodeChangeInProgress === true && (
              <span className="icon is-small is-left">
                <i className="fas fa-sync fa-spin" />
              </span>
            )}
            <p className="help">
              <a
                onClick={this.findNode}
                onKeyPress={this.findNode}
                role="button"
                tabIndex={0}
                className={linkColor}
                onMouseDown={event => event.preventDefault()}
              >
                {il8n.find_node}
              </a>
            </p>
          </div>
          {nodeChangeInProgress === true && (
            <div className="control">
              <button className="button is-dark is-loading">
                <span className="icon is-small">
                  <i className="fa fa-network-wired" />
                </span>
                &nbsp;&nbsp;{il8n.connect}
              </button>
            </div>
          )}
          {nodeChangeInProgress === false && (
            <div className="control">
              <button className="button is-dark" onClick={this.changeNode}>
                <span className="icon is-small">
                  <i className="fa fa-network-wired" />
                </span>
                &nbsp;&nbsp;{il8n.connect}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
