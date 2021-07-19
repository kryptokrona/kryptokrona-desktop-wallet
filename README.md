<p>
<a href="https://chat.kryptokrona.se"><img src="https://img.shields.io/discord/562673808582901793?label=Discord&logo=Discord&logoColor=white&style=plastic"></a> 
<a href="https://github.com/kryptokrona/kryptokrona-desktop-wallet/releases"><img src="https://img.shields.io/github/v/release/kryptokrona/kryptokrona-desktop-wallet?style=plastic"></a>
<a href="https://github.com/kryptokrona/kryptokrona-desktop-wallet/releases"><img src="https://img.shields.io/github/downloads/kryptokrona/kryptokrona-desktop-wallet/total?style=plastic"></a>
</p>

<img src="https://user-images.githubusercontent.com/3246908/125691331-a40a038f-c12e-4c37-9e96-de5b371bb103.png" height="800px">
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

## License

© [ExtraHash](https://github.com/ExtraHash)
See included License file for more details.

### Master Build Status

![Master Build Status](https://github.com/turtlecoin/turtle-wallet-proton/workflows/Build%20Proton/badge.svg?branch=master)

### Development Build Status

![Development Build Status](https://github.com/turtlecoin/turtle-wallet-proton/workflows/Build%20Proton/badge.svg?branch=development)
