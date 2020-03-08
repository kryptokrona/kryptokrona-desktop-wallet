<img src="https://camo.githubusercontent.com/d344c9e18b69f96502f3bf61b0dedc1ca9603af3/68747470733a2f2f6b727970746f6b726f6e612e73652f77702d636f6e74656e742f75706c6f6164732f323031392f30372f786b722d6c6f676f2d626c61636b2d746578742e706e67">

# Kryptokrona Desktop Wallet

<img src="https://cdn.discordapp.com/attachments/566202487019798529/686006405261688930/Screenshot_2020-03-08_at_00.12.19.png">
<p>
  This is a desktop wallet for Kryptokrona that uses <a href="http://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://github.com/kryptokrona/kryptokrona-wallet-backend-js">Kryptokrona-Wallet-Backend-JS</a>, <a href="https://github.com/reactjs/redux">Redux</a>, <a href="https://github.com/reactjs/react-router">React Router</a>, <a href="http://webpack.github.io/docs/">Webpack</a> and <a href="https://github.com/gaearon/react-hot-loader">React Hot Loader</a>.
</p>

<p>
  All of the code is released under the GPLv3 license. The icons in the ./resources and ./app/images folders, however, are not released under this license, rather they are maintained to be intellectual property of ExtraHash, and may not be used to represent the brand or identity of any other piece of software or group. See the included license file in ./resources/LICENSE and ./app/images/LICENSE for more details.
</p>

## Development Setup (All Platforms)

### Dependencies

#### You will need the following dependencies installed before you can proceed to the "Setup" step:

- Node.JS (Latest LTS version - 10.x) https://nodejs.org/

- Yarn https://yarnpkg.com/en/

- Git https://git-scm.com/downloads

Tip: If you already have a different version of node.js installed besides 10.x, try using [Node Version Manager](https://github.com/nvm-sh/nvm#install--update-script).

#### Setup

First, clone the repo via git:

```bash
git clone https://github.com/kryptokrona/kryptokrona-desktop-wallet.git
```

And then install the dependencies with yarn.

```bash
$ cd kryptokrona-desktop-wallet
$ yarn
```

Run the wallet.

```bash
$ yarn start
```

### Starting Development

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```bash
$ yarn dev
```

### Packaging

To package apps for the local platform:

```bash
$ yarn package
```

### Master Build Status

![Master Build Status](https://github.com/turtlecoin/turtle-wallet-proton/workflows/Build%20Proton/badge.svg?branch=master)

### Development Build Status

![Development Build Status](https://github.com/turtlecoin/turtle-wallet-proton/workflows/Build%20Proton/badge.svg?branch=development)

## License

© [ExtraHash](https://github.com/ExtraHash)
See included License file for more details.
