const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = (env = {}, argv = {}) => {
  const isProduction = argv.mode === 'production';
  const target = env.target || 'umd';
  
  const config = {
    entry: './src/index.js',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      clean: false, // Don't clean to preserve ESM and UMD builds together
      globalObject: 'this'
    },
    // externals is assigned per target below
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ["> 1%", "last 2 versions", "not dead"]
                  }
                }]
              ]
            }
          }
        }
      ]
    },
    
    plugins: [
      new ESLintPlugin({
        extensions: ['js'],
        fix: true
      })
    ],
    
    resolve: {
      extensions: ['.js']
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    optimization: {
      minimize: isProduction
    }
  };

  if (target === 'esm') {
    config.output.filename = isProduction ? 'cesium-heatbox.min.js' : 'cesium-heatbox.js';
    config.output.library = {
      type: 'module'
    };
    config.experiments = {
      outputModule: true
    };
    // ESM externals: keep as import 'cesium'
    config.externalsType = 'module';
    config.externals = {
      cesium: 'cesium'
    };
  } else {
    config.output.filename = isProduction ? 'cesium-heatbox.umd.min.js' : 'cesium-heatbox.umd.js';
    config.output.library = {
      name: 'CesiumHeatbox',
      type: 'umd',
      export: 'default'
    };
    config.externals = {
      cesium: {
        commonjs: 'cesium',
        commonjs2: 'cesium',
        amd: 'cesium',
        root: 'Cesium'
      }
    };
  }

  // 開発サーバー設定
  if (argv.serve) {
    config.devServer = {
      static: {
        directory: path.join(__dirname, 'examples'),
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true
    };
  }
  
  return config;
};
