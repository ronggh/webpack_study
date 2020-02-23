const {resolve} = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// 定义nodejs环境变量：决定使用browserslist的哪个环境
process.env.NODE_ENV = 'production';

// 复用Cssloader
const commonCssLoader = [
    // css 抽取成独立文件
    MiniCssExtractPlugin.loader,
    'css-loader',
    {
        // 还需要在package.json中定义browserslist
        loader: 'postcss-loader',
        options: {
            // css做兼容性处理
            ident: 'postcss',
            plugins: () => [require('postcss-preset-env')()]
        }
    }
];

module.exports = {
    entry: './src/js/index.js',
    output: {
        filename: 'js/built.js',
        path: resolve(__dirname, 'build')
    },
    module: {
        rules: [
            // 需要将js语法检查提到外面一层
            {
                // 在package.json中eslintConfig --> airbnb
                test: /\.js$/,
                exclude: /node_modules/,
                // 优先执行，以避免js语法检查和兼容性处理的两个loader产生冲突
                enforce: 'pre',
                loader: 'eslint-loader',
                options: {
                    fix: true
                }
            },
            {
                // oneOf 可以提升性能，以下loader只会匹配一个
                // 注意：不能有两个配置处理同一种类型文件
                oneOf: [
                    {
                        test: /\.css$/,
                        // 使用...三点运算符展开
                        use: [...commonCssLoader]
                    },
                    {
                        test: /\.less$/,
                        // 使用...三点运算符展开
                        use: [...commonCssLoader, 'less-loader']
                    },
                    /*
                      正常来讲，一个文件只能被一个loader处理。
                      当一个文件要被多个loader处理，那么一定要指定loader执行的先后顺序：
                        先执行eslint 在执行babel
                    */

                    // js做兼容性处理
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        useBuiltIns: 'usage',
                                        // 指定core-js的版本
                                        corejs: {version: 3},
                                        // 指定要兼容的浏览器版本
                                        targets: {
                                            chrome: '60',
                                            firefox: '50',
                                            ie: '9',
                                            safari: '10',
                                            edge: '17'
                                        }
                                    }
                                ]
                            ],
                            // 开启babel缓存
                            // 第二次构建时，会读取之前的缓存
                            cacheDirectory: true
                        }
                    },
                    // 处理图片，使用 url-loader
                    {
                        test: /\.(jpg|png|gif)/,
                        loader: 'url-loader',
                        options: {
                            // 小于8kb的转换base64编码格式，减少文件的请求数
                            limit: 8 * 1024,
                            // 取hash后的文件名前10个字符
                            name: '[hash:10].[ext]',
                            // 指定图片的输出路径
                            outputPath: 'imgs',
                            // 需要关闭ES6的模块语法
                            esModule: false
                        }
                    },
                    {
                        test: /\.html$/,
                        loader: 'html-loader'
                    },
                    // 其他文件放在media路径下，使用file-loader进行处理
                    {
                        exclude: /\.(js|css|less|html|jpg|png|gif)/,
                        loader: 'file-loader',
                        options: {
                            outputPath: 'media'
                        }
                    }
                ]
            }

        ]
    },
    plugins: [
        // 将css抽取成独立文件（不放在js中）
        new MiniCssExtractPlugin({
            filename: 'css/built.css'
        }),
        // 压缩CSS
        new OptimizeCssAssetsWebpackPlugin(),
        // 处理和压缩HTML代码
        new HtmlWebpackPlugin({
            template: './src/index.html',
            // 压缩HTML代码
            minify: {
                // 去除空白和回车换行
                collapseWhitespace: true,
                // 移除注释
                removeComments: true
            }
        })
    ],
    // production 生产模式下，自动进行js压缩
    mode: 'production'
};
