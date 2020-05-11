// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

import React, { Component } from 'react';
import log from 'electron-log';
import { Link, Redirect, withRouter } from 'react-router-dom';
import routes from '../constants/routes';
import { session, eventEmitter, il8n, loginCounter } from '../index';
import { uiType } from '../utils/utils';
import Modal from './Modal';
import Balance from './Balance';

type Location = {
  hash: string,
  pathname: string,
  search: string
};

type Props = {
  location: Location,
  darkMode: boolean,
  query?: string
};

type State = {
  navBarCount: number,
  query: string,
  submitSearch: boolean
};

class NavBar extends Component<Props, State> {
  props: Props;

  state: State;

  static defaultProps: any;

  constructor(props?: Props) {
    super(props);
    this.state = {
      navBarCount: loginCounter.navBarCount,
      query: props.query || '',
      submitSearch: false
    };
    this.logOut = this.logOut.bind(this);
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentDidMount() {
    loginCounter.navBarCount++;
  }

  componentWillUnmount() {}

  logOut = () => {
    eventEmitter.emit('logOut');
  };

  handleQueryChange = (event: any) => {
    this.setState({
      query: event.target.value,
      submitSearch: false
    });
  };

  handleSearch = (event: any) => {
    event.preventDefault();
    const { query } = this.state;

    if (query === '') {
      return;
    }

    log.debug(`User searched for ${query}`);

    this.setState({
      submitSearch: true
    });
  };

  render() {
    // prettier-ignore
    const { location: { pathname }, darkMode } = this.props;
    const { navBarCount, query, submitSearch } = this.state;
    const { fillColor, elementBaseColor, settingsCogColor } = uiType(darkMode);

    if (submitSearch && pathname !== `/search/${query}`) {
      const userSearchTerm = query;
      return <Redirect to={`/search/${userSearchTerm}`} />;
    }

    return (

      <div>
        <Modal darkMode={darkMode} />

              <div className="navbar-menu">
                <div className="navbar-start">
                  <Link to={routes.HOME} className="navbar-item">
                    <i className="fa fa-credit-card" />
                    {pathname === '/' && (
                      <p className="sans">
                        <strong>&nbsp;&nbsp;{il8n.wallet}</strong>
                      </p>
                    )}
                    {pathname !== '/' && <p>&nbsp;&nbsp;{il8n.wallet}</p>}
                  </Link>

                  <Link className="navbar-item" to={routes.SEND}>
                    <i className="fa fa-paper-plane" />
                    {pathname.includes('/send') && (
                      <strong>&nbsp;&nbsp;{il8n.send}</strong>
                    )}
                    {!pathname.includes('/send') && (
                      <p>&nbsp;&nbsp;{il8n.send}</p>
                    )}
                  </Link>

                  <Link className="navbar-item" to={routes.RECEIVE}>
                    <i className="fa fa-arrow-circle-down" />
                    {pathname === '/receive' && (
                      <strong>&nbsp;&nbsp;{il8n.receive}</strong>
                    )}
                    {pathname !== '/receive' && (
                      <p>&nbsp;&nbsp;{il8n.receive}</p>
                    )}
                  </Link>

                  <Link className="navbar-item" to={routes.ADDRESSBOOK}>
                    <i className="fas fa-address-book" />
                    {pathname === '/addressbook' && (
                      <strong>&nbsp;&nbsp;Address Book</strong>
                    )}
                    {pathname !== '/addressbook' && (
                      <p>&nbsp;&nbsp;Address Book</p>
                    )}
                  </Link>

                  <Link className="navbar-item" to={routes.SETTINGS}>
                  <i className="fa fa-cog" />
                  {pathname === '/settings' && (
                    <strong>&nbsp;&nbsp;Address Book</strong>
                  )}
                  {pathname !== '/settings' && (
                    <p>&nbsp;&nbsp;Address Book</p>
                  )}
                </Link>
                </div>
                <div className="navbar-end">

                  {session.walletPassword !== '' && (
                    <div className="navbarLogout">
                    <div className="navbar-item">
                      <Link className="buttons" to={routes.LOGIN}>
                        <span
                          className="button icon is-large is-dark"
                          onClick={this.logOut}
                          onKeyPress={this.logOut}
                          role="button"
                          tabIndex={0}
                        >
                          <i className="fa fa-lock" />
                        </span>
                      </Link>
                    </div>
                    </div>
                  )}

                </div>
          {!loginCounter.isLoggedIn && (
            <nav
              className={`navbar ${elementBaseColor}`}
              role="navigation"
              aria-label="main navigation"
            >
              <div className="navbar-menu">
                <div className="navbar-brand" />
                <div className="navbar-end">
                  <div className="navbar-item">
                    <span
                      className="icon button is-large is-danger"
                      onClick={() => {
                        eventEmitter.emit('goToLogin');
                      }}
                      onKeyPress={() => {
                        eventEmitter.emit('goToLogin');
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <i className="fas fa-chevron-left" />
                    </span>
                  </div>
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    );
  }
}

NavBar.defaultProps = {
  query: ''
};

export default withRouter(NavBar);
