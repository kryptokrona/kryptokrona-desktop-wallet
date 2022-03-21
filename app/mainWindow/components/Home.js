// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import log from 'electron-log';
import { remote, ipcRenderer } from 'electron';
import React, { Component, Fragment } from 'react';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter, il8n, loginCounter, config } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import BalanceTop from './BalanceTop';
import Redirector from './Redirector';
import moment from 'moment';
import {
  uiType,
  formatLikeCurrency,
  atomicToHuman,
  convertTimestamp
} from '../utils/utils';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';




let displayedTransactionCount: number = 50;

type Props = {};

type State = {
  transactions: Array<any>,
  transactionCount: number,
  darkMode: boolean,
  displayCurrency: string,
  fiatPrice: number,
  fiatSymbol: string,
  symbolLocation: string,
  fiatDecimals: number,
  pageAnimationIn: string,
  expandedRows: string[],
  networkBlockHeight: number
};

export default class Home extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      transactions: session.getTransactions(),
      transactionCount: session.getTransactionCount(),
      darkMode: config.darkMode,
      displayCurrency: config.displayCurrency,
      fiatPrice: session.fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals,
      pageAnimationIn: loginCounter.getAnimation('/'),
      expandedRows: [],
      networkBlockHeight: session.getNetworkBlockHeight()
    };
    this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
      this
    );
    this.openNewWallet = this.openNewWallet.bind(this);
    this.modifyCurrency = this.modifyCurrency.bind(this);
    this.expandRow = this.expandRow.bind(this);
    this.openInExplorer = this.openInExplorer.bind(this);
    this.handleNewSyncStatus = this.handleNewSyncStatus.bind(this);
    this.handleNewTransactions = this.handleNewTransactions.bind(this);
    this.handleNewTransactionCount = this.handleNewTransactionCount.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('openNewWallet', this.openNewWallet);
    eventEmitter.on('gotSyncStatus', this.handleNewSyncStatus);
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
    eventEmitter.on('gotTransactionCount', this.handleNewTransactionCount);
    eventEmitter.on('gotNewTransactions', this.handleNewTransactions);
    const { loginFailed, firstLoadOnLogin } = session;
    if (firstLoadOnLogin && loginFailed === false) {
      this.switchOffAnimation();
    }
  }

  componentWillUnmount() {
    displayedTransactionCount = 50;
    eventEmitter.off('gotSyncStatus', this.handleNewSyncStatus);
    eventEmitter.off('openNewWallet', this.openNewWallet);
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
    eventEmitter.off('gotTransactionCount', this.handleNewTransactionCount);
    eventEmitter.off('gotNewTransactions', this.handleNewTransactions);
  }

  handleNewTransactionCount = () => {
    this.setState({
      transactionCount: session.getTransactionCount()
    });
  };

  handleNewTransactions = () => {
    this.setState({
      transactions: session.getTransactions()
    });
  };

  handleNewSyncStatus = () => {
    this.setState({
      networkBlockHeight: session.getNetworkBlockHeight()
    });
  };

  openInExplorer = (event: any) => {
    let hash = event.target.value;
    if (hash == undefined) {
      hash = event.target.parentNode.value
    }
    remote.shell.openExternal(
      `https://explorer.kryptokrona.se/transaction.html?hash=${encodeURIComponent(hash)}`
    );
  };

  modifyCurrency = (displayCurrency: string) => {
    this.setState({
      displayCurrency
    });
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice
    });
  };

  switchOffAnimation() {
    session.firstLoadOnLogin = false;
  }

  refreshListOnNewTransaction = () => {
    log.debug('Transaction found, refreshing transaction list...');
    displayedTransactionCount += 1;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  };

  openNewWallet = () => {
    log.debug('Initialized new wallet session, refreshing transaction list...');
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  };

  // TODO: implement paging instead of just loading +50
  handleLoadMore = (event: any) => {
    event.preventDefault();
    displayedTransactionCount += 50;
    ipcRenderer.send(
      'fromFrontend',
      'transactionRequest',
      displayedTransactionCount
    );
  };

  resetDefault = (event: any) => {
    event.preventDefault();
    displayedTransactionCount = 50;
    ipcRenderer.send(
      'fromFrontend',
      'transactionRequest',
      displayedTransactionCount
    );
  };

  expandRow = (event: any) => {
    const transactionHash = event.target.value;
    const { expandedRows } = this.state;
    if (!expandedRows.includes(transactionHash)) {
      expandedRows.push(transactionHash);
    } else {
      const index = expandedRows.indexOf(transactionHash);
      if (index > -1) {
        expandedRows.splice(index, 1);
      }
    }
    this.setState({
      expandedRows
    });
  };

  render() {

    const {
      darkMode,
      transactions,
      transactionCount,
      fiatPrice,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      fiatDecimals,
      pageAnimationIn,
      expandedRows,
      networkBlockHeight
    } = this.state;
    const {
      backgroundColor,
      textColor,
      tableMode,
      toolTipColor,
      elementBaseColor,
      fillColor
    } = uiType(darkMode);


    const data = [];
    console.log(session.syncStatus[1] - session.syncStatus[0]);
    if (session.syncStatus[1] - session.syncStatus[0] < 3) {
    let i = 30;
    let past_time = Math.round(new Date(Date.now() - 24 * 3600 * 1000).getTime() / 1000);
    let last_balance = 0;

    for (let tx in transactions) {

      console.log('tx', transactions[tx][0]);
      console.log('timestamp', past_time);
      console.log(transactions[tx][0] > past_time);

      // if (tx == 0) {
      // First time run, this is our starting date
      //
      //   data.push({
      //     timestamp: txs[tx][0],
      //     crypto: atomicToHuman(txs[tx][3]),
      //     fiat: fiatPrice * atomicToHuman(txs[tx][3], false)
      //   })
      //
      //   past_time = txs[tx][0] - 60 * 24;
      //
      //   console.log('Latest tx is from ', moment(past_time).format('DD/MM hh:mm'));
      //
      // } else if (txs[tx][0] < past_time) {
      //   // Not first run, and

      data.push({
        timestamp: transactions[tx][0],
        XKR: atomicToHuman(transactions[tx][3]),
        fiat: fiatPrice * atomicToHuman(transactions[tx][3], false)
      })
      }
    //
    //   past_time = txs[tx][0] - 60 * 24;
    //   console.log('Latest tx is from ', moment(past_time).format('DD/MM hh:mm'));
    //   console.log('lol');
    // }

    }

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            effect="solid"
            type={toolTipColor}
            multiline
            place="top"
          />
          <BalanceTop darkMode={darkMode} />
          <NavBar darkMode={darkMode} />
          <div
            className={`maincontent-homescreen ${backgroundColor} ${pageAnimationIn}`}
          >
          {transactions.length > 3 && session.syncStatus[1] - session.syncStatus[0] < 3 && (
          <ResponsiveContainer width="100%" height="25%">

          <AreaChart width={730} height={250} data={data.slice().reverse()}
                margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis axisLine={false} dataKey="timestamp" tickFormatter={timeStr => moment(timeStr*1000).format('DD/MM')} />
                <YAxis tick={false} axisLine={false} />
                <Tooltip labelFormatter={timeStr => moment(timeStr*1000).format('DD/MM hh:mm')} />
                <Area type="monotone" dataKey="XKR" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>

            </ResponsiveContainer>
          )}
            <table
              className={`table tx-table is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
            >

              <tbody>
                {transactions.map(tx => {
                  const rowIsExpanded = expandedRows.includes(tx[1]);
                  const transactionHash = tx[1];
                  const toggleSymbol = rowIsExpanded ? '.' : '.';
                  return (
                    <Fragment key={transactionHash}>
                      <tr>
                        <td>
                          <button
                            value={transactionHash}
                            onClick={this.expandRow}
                            className={`transparent-button ${textColor}`}
                            onMouseDown={event => event.preventDefault()}
                          >
                            {toggleSymbol}
                          </button>
                        </td>
                        <td>
                          {tx[0] === 0 && (
                            <p className="has-text-danger">
                              {il8n.unconfirmed}
                            </p>
                          )}
                          {tx[0] > 0 && <p>{convertTimestamp(tx[0])}</p>}
                        </td>
                        <td>{tx[1]}</td>
                        {tx[2] < 0 && (
                          <td>
                            <p className="has-text-danger has-text-right">
                              {displayCurrency === 'XKR' &&
                                atomicToHuman(tx[2], true)}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'prefix' &&
                                fiatPrice !== 0 &&
                                `-${fiatSymbol}${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                ).substring(1)}`}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'suffix' &&
                                fiatPrice !== 0 &&
                                `-${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(2)
                                ).substring(1)}${fiatSymbol}`}
                              {displayCurrency === 'fiat' &&
                                fiatPrice === 0 &&
                                ''}
                            </p>
                          </td>
                        )}
                        {tx[2] > 0 && (
                          <td>
                            <p className="has-text-right">
                              {displayCurrency === 'XKR' &&
                                atomicToHuman(tx[2], true)}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'prefix' &&
                                `${fiatSymbol}${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                )}`}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'suffix' &&
                                `${formatLikeCurrency(
                                  (
                                    fiatPrice * atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                )}${fiatSymbol}`}
                            </p>
                          </td>
                        )}
                        <td>
                          <p className="has-text-right">
                            {displayCurrency === 'XKR' &&
                              atomicToHuman(tx[3], true)}
                            {displayCurrency === 'fiat' &&
                              symbolLocation === 'prefix' &&
                              `${fiatSymbol}${formatLikeCurrency(
                                (
                                  fiatPrice * atomicToHuman(tx[3], false)
                                ).toFixed(fiatDecimals)
                              )}`}
                            {displayCurrency === 'fiat' &&
                              symbolLocation === 'suffix' &&
                              `${formatLikeCurrency(
                                (
                                  fiatPrice * atomicToHuman(tx[3], false)
                                ).toFixed(fiatDecimals)
                              )}${fiatSymbol}`}
                          </p>
                        </td>
                      </tr>
                      {rowIsExpanded && (
                        <tr>
                          <td />
                          <td colSpan={4}>
                            <table className="swing-in-top-fwd">
                              <tbody>
                                <tr className="no-hover">
                                  <td>
                                    <p>
                                      <b>Date & Time</b>
                                      <br />
                                      <b>Confirmations</b>
                                      <br />
                                      <b>Block Height</b>
                                      <br />
                                      <b>Unlock Time</b>
                                      <br />
                                      <b>Transaction Hash</b>
                                      <br />
                                      <b>Payment ID</b>
                                      <br />
                                      <b>Fee</b>
                                      <br />
                                      <b>Amount</b>
                                      <br />
                                    </p>
                                  </td>
                                  <td className="expanded-tx-data">
                                    {tx[0] === 0
                                      ? 'Still In Memory Pool'
                                      : convertTimestamp(tx[0])}
                                    <br />
                                    {tx[0] !== 0
                                      ? Math.max(networkBlockHeight - tx[4], 0)
                                      : 0}
                                    <br />
                                    {tx[0] === 0
                                      ? 'Still In Memory Pool'
                                      : formatLikeCurrency(tx[4])}
                                    <br />
                                    {tx[8]} <br />
                                    {tx[1]} <br />
                                    {tx[5] !== '' ? tx[5] : 'none'}
                                    <br />
                                    {atomicToHuman(tx[7], true)} XKR
                                    <br />
                                    <p
                                      className={
                                        tx[2] < 0
                                          ? 'is-negative-transaction has-text-danger'
                                          : ''
                                      }
                                    >
                                      {atomicToHuman(tx[2], true)} XKR
                                    </p>
                                    <br />
                                    <br />
                                    <button
                                      className={`button ${elementBaseColor}`}
                                      value={transactionHash}
                                      onClick={this.openInExplorer}
                                    >
                                    <i className="fa fa-search" aria-hidden="true"></i>
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="elem-to-center">
                <div className={`box ${fillColor}`}>
                  <p className={`${textColor} subtitle has-text-centered`}>
                    You don&apos;t have any transactions yet. They will display
                    here once you do.
                  </p>
                </div>
              </div>
            )}
            {transactions.length > transactionCount && (
              <form>
                <div className="field">
                  <div className="buttons">
                    <button
                      type="submit"
                      className="button is-dark"
                      onClick={this.handleLoadMore}
                    >
                      {il8n.load_more}
                    </button>
                    <button
                      type="submit"
                      className="button is-dark"
                      onClick={this.resetDefault}
                    >
                      {il8n.reset}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
