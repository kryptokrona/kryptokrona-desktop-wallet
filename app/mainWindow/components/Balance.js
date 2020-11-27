// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import ReactTooltip from 'react-tooltip';
import { session, il8n, eventEmitter, config, configManager } from '../index';
import { formatLikeCurrency, atomicToHuman } from '../utils/utils';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  unlockedBalance: number,
  lockedBalance: number,
  fiatPrice: number,
  displayCurrency: string,
  fiatSymbol: string,
  symbolLocation: string,
  fiatDecimals: number
};

export default class Balance extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      fiatPrice: session.fiatPrice,
      displayCurrency: config.displayCurrency,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimalsyarn
    };
    this.updateFiatPrice = this.updateFiatPrice.bind(this);
    this.switchCurrency = this.switchCurrency.bind(this);
    this.handleNewBalance = this.handleNewBalance.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('gotNewBalance', this.handleNewBalance);
  }

  componentWillUnmount() {
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('gotNewBalance', this.handleNewBalance);
  }

  handleNewBalance = () => {
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals
    });
  };

  switchCurrency = () => {
    const { displayCurrency } = this.state;
    if (displayCurrency === 'XKR') {
      this.setState({
        displayCurrency: 'fiat'
      });
      configManager.modifyConfig('displayCurrency', 'fiat');
      eventEmitter.emit('modifyCurrency', 'fiat');
    }
    if (displayCurrency === 'fiat') {
      this.setState({
        displayCurrency: 'XKR'
      });
      configManager.modifyConfig('displayCurrency', 'XKR');
      eventEmitter.emit('modifyCurrency', 'XKR');
    }
    ReactTooltip.rebuild();
  };

  render() {
    const { darkMode, size } = this.props;
    const {
      unlockedBalance,
      lockedBalance,
      fiatPrice,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      fiatDecimals
    } = this.state;
    const color = darkMode ? 'is-dark' : 'is-white';

    let balanceTooltip;

    if (displayCurrency === 'XKR') {
      balanceTooltip =
        `Unlocked: ${atomicToHuman(unlockedBalance, true)} ${il8n.TRTL}<br>` +
        `Locked: ${atomicToHuman(lockedBalance, true)} ${il8n.TRTL}`;
    } else if (symbolLocation === 'prefix' && displayCurrency === 'fiat') {
      balanceTooltip =
        `Unlocked: ${fiatSymbol}${formatLikeCurrency(
          Number(fiatPrice * atomicToHuman(unlockedBalance, false)).toFixed(
            fiatDecimals
          )
        )}
        <br>` +
        `Locked: ${fiatSymbol}${formatLikeCurrency(
          Number(fiatPrice * atomicToHuman(lockedBalance, false)).toFixed(
            fiatDecimals
          )
        )}
        <br>`;
    } else if (symbolLocation === 'suffix' && displayCurrency === 'fiat') {
      balanceTooltip =
        `Unlocked: ${(
          fiatPrice * atomicToHuman(unlockedBalance, false)
        ).toFixed(fiatDecimals)}${fiatSymbol}
        <br>` +
        `Locked: ${(fiatPrice * atomicToHuman(lockedBalance, false)).toFixed(
          fiatDecimals
        )}${fiatSymbol}`;
    } else {
      balanceTooltip = 'No wallet open!';
    }

    return (
      <div
        className="control statusicons topBalance"
        role="button"
        tabIndex={0}
        className="control statusicons"
       onClick={this.switchCurrency}
       onKeyPress={this.switchCurrency}
        onMouseDown={event => event.preventDefault()}
      >
        <div className="tags has-addons">

          {displayCurrency === 'XKR' && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-dark ${size} balanceText scanlines`
                  : `tag is-dark ${size} balanceText scanlines`
              }
              data-tip={balanceTooltip}
            >
              &nbsp;
              <span className="unlocked">
              {atomicToHuman(unlockedBalance, true)}
              </span>
              <span className="locked">+&nbsp;
              {atomicToHuman(lockedBalance, true)}
              </span>
            </span>
          )}
          {displayCurrency === 'fiat' && symbolLocation === 'suffix' && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-dark ${size} balanceText scanlines`
                  : `tag is-dark ${size} balanceText scanlines`
              }
              data-tip={balanceTooltip}
            >
              &nbsp;
              <span className="unlocked">
              {formatLikeCurrency(
                Number(
                  (
                    fiatPrice *
                    atomicToHuman(unlockedBalance, false)
                  ).toFixed(fiatDecimals)
                )
              ) + " " + fiatSymbol}
              </span>
              <span className="locked">+&nbsp;
              {formatLikeCurrency(
                Number(
                  (
                    fiatPrice *
                    atomicToHuman(lockedBalance, false)
                  ).toFixed(fiatDecimals)
                )
              ) + " " + fiatSymbol}
              </span>
            </span>
          )}
          {displayCurrency === 'fiat' && symbolLocation === 'prefix' && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-dark ${size} balanceText scanlines`
                  : `tag is-dark ${size} balanceText scanlines`
              }
              data-tip={balanceTooltip}
            >
              &nbsp;
              <span className="unlocked">
              {fiatSymbol +formatLikeCurrency(
                Number(
                  (
                    fiatPrice *
                    atomicToHuman(unlockedBalance, false)
                  ).toFixed(fiatDecimals)
                )
              )}
              </span>
              <span className="locked">+&nbsp;
              {fiatSymbol + formatLikeCurrency(
                Number(
                  (
                    fiatPrice *
                    atomicToHuman(lockedBalance, false)
                  ).toFixed(fiatDecimals)
                )
              )}
              </span>
            </span>
          )}
        </div>
      </div>
    );
  }
}
