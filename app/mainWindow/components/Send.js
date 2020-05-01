// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

/* eslint-disable jsx-a11y/label-has-associated-control */

import crypto from 'crypto';
import { ipcRenderer } from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import React, { Component } from 'react';
import Creatable from 'react-select/creatable';
import ReactTooltip from 'react-tooltip';
import {
  session,
  eventEmitter,
  il8n,
  config,
  loginCounter,
  addressList
} from '../index';
import NavBar from './NavBar';
import BalanceTop from './BalanceTop';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import { uiType, atomicToHuman, search } from '../utils/utils';
import donateInfo from '../constants/donateInfo.json';

import { openAlias } from 'openalias';



type Props = {
  uriAddress?: string,
  uriPaymentID?: string
};

type State = {
  unlockedBalance: number,
  enteredAmount: string,
  totalAmount: string,
  paymentID: string,
  darkMode: boolean,
  transactionInProgress: boolean,
  displayCurrency: string,
  fiatPrice: number,
  fiatSymbol: string,
  symbolLocation: string,
  sendToAddress: string,
  pageAnimationIn: string,
  selectedContact: any,
  menuIsOpen: boolean,
  nodeFee: number,
  sendAll: boolean
};

const customStyles = {
  control: base => ({
    ...base,
    background: 'hsl(0, 0%, 6%)',
    height: 54,
    minHeight: 54,
    fontSize: '1rem'
  }),
  placeholder: base => ({
    ...base,
    color: 'hsl(0, 0%, 71%)',
    fontWeight: 'normal'
  }),
  menuList: base => ({
    ...base,
    color: 'hsl(0, 0%, 21%)',
    fontWeight: 'normal'
  }),
  singleValue: base => ({
    ...base,
    fontWeight: 'normal'
  })
};

export default class Send extends Component<Props, State> {
  props: Props;

  state: State;

  autoCompleteContacts: any[];

  static defaultProps: any;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      enteredAmount: '',
      sendToAddress: props.uriAddress || '',
      paymentID: props.uriPaymentID || '',
      darkMode: config.darkMode,
      transactionInProgress: false,
      displayCurrency: config.displayCurrency,
      fiatPrice: session.fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      pageAnimationIn: loginCounter.getAnimation('/send'),
      selectedContact: null,
      menuIsOpen: false,
      nodeFee: session.getNodeFee(),
      sendAll: false
    };

    this.generatePaymentID = this.generatePaymentID.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.handleTransactionInProgress = this.handleTransactionInProgress.bind(
      this
    );
    this.handleTransactionCancel = this.handleTransactionCancel.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.sendAll = this.sendAll.bind(this);
    this.handlePaymentIDChange = this.handlePaymentIDChange.bind(this);
    this.updateFiatPrice = this.updateFiatPrice.bind(this);
    this.handleSendToAddressChange = this.handleSendToAddressChange.bind(this);
    this.prepareTransaction = this.prepareTransaction.bind(this);
    this.checkInputLength = this.checkInputLength.bind(this);
    this.handleDonate = this.handleDonate.bind(this);
    this.handleNewNodeFee = this.handleNewNodeFee.bind(this);
    this.autoCompleteContacts = [
      ...addressList.map(contact => {
        return { label: contact.name, value: contact.address };
      })
    ];
    this.handleBackendMessages = this.handleBackendMessages.bind(this);
    this.devContact = {
      label: donateInfo.name,
      value: donateInfo.address
    };
  }

  componentDidMount() {
    eventEmitter.on('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.on('transactionCancel', this.handleTransactionCancel);
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('gotNodeFee', this.handleNewNodeFee);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
    ipcRenderer.on('handleDonate', this.handleDonate);
    ipcRenderer.on('fromBackend', this.handleBackendMessages);
    // eslint-disable-next-line react/destructuring-assignment
    if (this.props && this.props.uriAddress) {
      const { uriAddress } = this.props;

      const selectedContact = search(
        uriAddress,
        [this.devContact, ...this.autoCompleteContacts],
        'value'
      );

      this.setState({
        selectedContact
      });
    }
  }

  componentWillUnmount() {
    eventEmitter.off('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.off('transactionCancel', this.handleTransactionCancel);
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('gotNodeFee', this.handleNewNodeFee);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
    ipcRenderer.off('handleDonate', this.handleDonate);
    ipcRenderer.off('fromBackend', this.handleBackendMessages);
  }

  modifyCurrency = (displayCurrency: string) => {
    this.setState({
      displayCurrency
    });
    this.resetAmounts();
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice
    });
  };

  handleTransactionInProgress = () => {
    this.setState({
      transactionInProgress: true
    });
  };

  handleTransactionCancel = () => {
    this.setState({
      transactionInProgress: false
    });
  };

  handleNewNodeFee = () => {
    this.setState({
      nodeFee: session.getNodeFee()
    });
  };

  handleDonate = () => {
    this.handleAddressChange(this.devContact);
  };

  handleAmountChange = (event: any) => {
    let enteredAmount = event.target.value;
    if (enteredAmount === '') {
      this.setState({
        enteredAmount: ''
      });
      return;
    }
    if (enteredAmount === '.') {
      enteredAmount = '0.';
    }

    const regex = /^\d*(\.(\d\d?)?)?$/;
    if (!regex.test(enteredAmount) === true) {
      return;
    }

    this.setState({
      enteredAmount
    });
  };

  handleBackendMessages = (event: Electron.IpcRendererEvent, message: any) => {
    const { messageType, data } = message;
    const { darkMode } = this.state;
    const { textColor } = uiType(darkMode);
    if (messageType === 'sendTransactionResponse') {
      if (data.status === 'SUCCESS') {
        this.resetForm();
      }
    }
    if (messageType === 'prepareTransactionResponse') {
      eventEmitter.emit('transactionCancel');
      if (data.status === 'SUCCESS') {
        const { address, paymentID, amount, fee, nodeFee, hash } = data;
        session.setPreparedTransactionHash(hash);
        const modalMessage = (
          <div>
            <center>
              <p className={`title ${textColor}`}>Confirm Transaction</p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              <b>Send to:</b>
              <br />
              {address}
            </p>
            <p className={`subtitle ${textColor}`}>
              <b>Total Amount: (includes fees)</b>
              <br />
              {atomicToHuman(amount + nodeFee + fee, true)} XKR
            </p>
            <p className={`subtitle ${textColor}`}>
              <b>Fee:</b>
              <br />
              {atomicToHuman(nodeFee + fee, true)} XKR
              {nodeFee > 0 &&
                ` (including a node fee of ${atomicToHuman(
                  nodeFee,
                  true
                )} XKR)`}
            </p>{' '}
            {paymentID !== '' && (
              <p className={`subtitle ${textColor}`}>
                <b>Payment ID:</b>
                <br />
                {paymentID}
              </p>
            )}
          </div>
        );
        eventEmitter.emit(
          'openModal',
          modalMessage,
          'Send it!',
          'Wait a minute...',
          'sendTransaction'
        );
      } else {
        log.info(data);
      }
    }
  };

  handleSendToAddressChange = (event: any) => {
    const sendToAddress = event.target.value;
    this.setState({
      sendToAddress
    });
  };

  prepareTransaction = (event: any) => {
    if (event) event.preventDefault();
    const {
      sendToAddress,
      paymentID,
      darkMode,
      displayCurrency,
      enteredAmount,
      fiatPrice,
      sendAll
    } = this.state;
    const { textColor } = uiType(darkMode);

    const sufficientFunds = sendAll
      ? true
      : (session.getUnlockedBalance() + session.getLockedBalance()) / 100 >=
        Number(enteredAmount);

    const sufficientUnlockedFunds = sendAll
      ? true
      : session.getUnlockedBalance() > Number(enteredAmount) / 100;

    if (!sendAll && (sendToAddress === '' || enteredAmount === '')) {
      return;
    }

    if (!sufficientFunds) {
      log.info(session.getUnlockedBalance(), session.getLockedBalance());
      log.info(enteredAmount);
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The transaction was not successful. You don&apos;t have enough
            funds!
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
      return;
    }

    if (!sufficientUnlockedFunds) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The transaction was not successful.
          </p>
          <p className={`subtitle ${textColor}`}>
            You don&apos;t have enough unlocked funds! Wait until your funds
            unlock then try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
      eventEmitter.emit('transactionCancel');
      return;
    }

    const transactionData = {
      address: sendToAddress,
      amount:
        displayCurrency === 'XKR'
          ? Number(enteredAmount) * 100
          : (Number(enteredAmount) * 100) / fiatPrice,
      paymentID,
      sendAll
    };

    ipcRenderer.send(
      'fromFrontend',
      'prepareTransactionRequest',
      transactionData
    );
  };

  createTestTransaction = async () => {
    const sendToAddress = await session.getPrimaryAddress();
    const amount = 100;
    const paymentID = this.generatePaymentID();

    await this.setState({
      selectedContact: { label: sendToAddress, value: sendToAddress },
      enteredAmount: String(amount / 100),
      sendToAddress,
      paymentID,
      sendAll: false
    });
    this.prepareTransaction();
  };

  generatePaymentID = () => {
    const paymentID = crypto.randomBytes(32).toString('hex');
    log.debug(`Generated paymentID: ${paymentID}`);
    this.setState({ paymentID });
    return paymentID;
  };

  handlePaymentIDChange = (event: any) => {
    this.setState({ paymentID: event.target.value });
  };

  resetForm = () => {
    this.setState({
      paymentID: '',
      enteredAmount: '',
      sendToAddress: '',
      selectedContact: null
    });
  };

  resetAmounts = () => {
    this.setState({ enteredAmount: '' });
  };

  sendAll = () => {
    const { unlockedBalance, fiatPrice, displayCurrency, nodeFee } = this.state;

    const totalAmount =
      unlockedBalance - 10 - parseInt(nodeFee, 10) <= 0 ? 0 : unlockedBalance;
    const enteredAmount =
      unlockedBalance - 10 - parseInt(nodeFee, 10) <= 0
        ? 0
        : totalAmount - 10 - parseInt(nodeFee, 10);
    this.setState({
      enteredAmount:
        displayCurrency === 'XKR'
          ? atomicToHuman(enteredAmount, false).toString()
          : atomicToHuman(enteredAmount * fiatPrice, false).toString()
    });
  };

  checkInputLength = (input: string) => {
    if (input.length > 1) {
      this.setState({
        menuIsOpen: true
      });
    } else {
      this.setState({
        menuIsOpen: false
      });
    }
  };

  handleAddressChange = (event: any) => {
    if (event) {
      let oaname = '';
      try {
      openAlias(event.value).then(wallets => {

        if (wallets) {

          let open_alias_address = wallets[0].address.substring(0,99);
          console.log(open_alias_address);
          oaname = wallets[0].name;
          this.setState({
            sendToAddress: open_alias_address,
            selectedContact: { label: ' ✅' + oaname, value: ' ✅' + oaname },
          });

        }


      });
    } catch {

    }

      // eslint-disable-next-line no-underscore-dangle
      if (event.__isNew__ || event.__isDonate__) {
        this.setState({
          selectedContact: { label: event.value, value: event.value },
          sendToAddress: event.value
        });
        return;
      }

      const { paymentID } = search(
        event.value,
        [donateInfo, ...addressList],
        'address'
      );

      this.setState({
        selectedContact: event,
        sendToAddress: event.value,
        paymentID: paymentID || ''
      });
    } else {
      this.setState({
        selectedContact: null
      });
    }
  };

  roundDown(x: number) {
    return Math.floor(x * 100) / 100;
  }

  render() {
    const {
      darkMode,
      enteredAmount,
      paymentID,
      transactionInProgress,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      sendToAddress,
      pageAnimationIn,
      selectedContact,
      menuIsOpen,
      sendAll
    } = this.state;

    const exampleAmount =
      symbolLocation === 'prefix' ? `${fiatSymbol}100` : `100${fiatSymbol}`;

    const {
      backgroundColor,
      textColor,
      elementBaseColor,
      toolTipColor,
      linkColor
    } = uiType(darkMode);

    const addressInput = (
      <a
        href="#addressinput"
        onClick={event => event.preventDefault()}
        id="#addressinput"
      >
        <Creatable
          multi
          options={this.autoCompleteContacts}
          placeholder="Enter a SEKR address or a contact name to send funds to"
          // eslint-disable-next-line no-unused-vars
          noOptionsMessage={inputValue => null}
          styles={customStyles}
          isClearable
          formatCreateLabel={value => {
            return `Send to ${value}`;
          }}
          value={selectedContact}
          onChange={this.handleAddressChange}
          id="autoCompleteAddress"
          menuIsOpen={menuIsOpen}
          onInputChange={this.checkInputLength}
        />
      </a>
    );

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}  hide-scrollbar`}>
          <ReactTooltip
            effect="solid"
            type={toolTipColor}
            multiline
            place="top"
          />
          <BalanceTop darkMode={darkMode} />
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor} ${pageAnimationIn}`}>
            <form onSubmit={this.prepareTransaction}>
              <div className="field">
                <div className="control">
                  <label
                    className={`label ${textColor}`}
                    htmlFor="autoCompleteAddress"
                  >
                    Send to
                    {addressInput}
                  </label>
                </div>
              </div>

              <div className="field" hidden>
                <label className={`label ${textColor}`} htmlFor="address">
                  {il8n.send_to_address}
                  <div className="control">
                    <input
                      className="input is-medium"
                      type="text"
                      placeholder={il8n.send_to_address_input_placeholder}
                      value={sendToAddress}
                      onChange={this.handleSendToAddressChange}
                      id="address"
                    />
                  </div>
                </label>
              </div>
              <div className="field">
                <div className="control">
                  <label className={`label ${textColor}`} htmlFor="amount">
                    {il8n.amount_to_send}
                    <input
                      className="input is-medium"
                      type="text"
                      placeholder={
                        sendAll
                          ? 'Sending entire wallet balance '
                          : `How much to send (eg. ${
                              displayCurrency === 'fiat'
                                ? exampleAmount
                                : '100 XKR'
                            })`
                      }
                      value={enteredAmount}
                      onChange={this.handleAmountChange}
                      id="amount"
                      disabled={sendAll}
                    />
                    <label className="checkbox is-small">
                      <p className={textColor}>
                        <input
                          type="checkbox"
                          checked={sendAll}
                          onChange={event => {
                            this.setState({
                              sendAll: event.target.checked,
                              enteredAmount: ''
                            });
                          }}
                        />{' '}
                        Send all
                      </p>
                    </label>
                  </label>
                </div>
              </div>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="paymentid">
                  {il8n.payment_id}
                  <div className="control">
                    <input
                      className="input is-small"
                      type="text"
                      placeholder={il8n.payment_id_input_placeholder}
                      value={paymentID}
                      onChange={this.handlePaymentIDChange}
                      id="paymentid"
                    />
                    <a
                      onClick={this.generatePaymentID}
                      onKeyPress={this.generatePaymentID}
                      role="button"
                      tabIndex={0}
                      className={linkColor}
                      onMouseDown={event => event.preventDefault()}
                    >
                      {il8n.generate_payment_id}
                    </a>
                  </div>
                </label>
              </div>
              <div className="buttons">
                {!transactionInProgress && (
                  <button type="submit" className="button is-dark is-small">
                    <span className="icon is-small">
                      <i className="fa fa-paper-plane" />
                    </span>
                    &nbsp;&nbsp;{il8n.send}
                  </button>
                )}
                {transactionInProgress && (
                  <button
                    type="submit"
                    className="button is-dark is-small is-loading is-disabled"
                    disabled
                  >
                    <span className="icon is-small">
                      <i className="fa fa-paper-plane" />
                    </span>
                    &nbsp;&nbsp;{il8n.send}
                  </button>
                )}

                <button
                  type="reset"
                  className={`button is-small is-dark ${elementBaseColor}`}
                  onClick={this.resetForm}
                >
                  <span className="icon is-small">
                    <i className="fa fa-undo" />
                  </span>
                  &nbsp;&nbsp;{il8n.clear}
                </button>
                {isDev && (
                  <div>
                    <a
                      className="button is-dark is-small"
                      onClick={this.createTestTransaction}
                      onKeyPress={this.createTestTransaction}
                      role="button"
                      tabIndex={0}
                      type="action"
                      onMouseDown={event => event.preventDefault()}
                    >
                      <span className="icon is-small">
                        <i className="fa fa-flask" />
                      </span>
                      &nbsp;&nbsp;Test
                    </a>
                  </div>
                )}
              </div>
            </form>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}

Send.defaultProps = {
  uriAddress: '',
  uriPaymentID: ''
};
