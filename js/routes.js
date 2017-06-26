angular.module('starter.routes', [])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('tab', {
                url: '/tab',
                abstract: 'true',
                templateUrl: 'templates/tabs.html'
            })
            .state('tab.home', {
                url: '/home',
                // cache: false,
                views: {
                    'tab-home': {
                        templateUrl: 'templates/tab/tab-home.html',
                        controller: 'homeCtrl'
                    }
                }
            })
            .state('tab.my', {
                url: '/my',
                // cache: false,
                views: {
                    'tab-my': {
                        templateUrl: 'templates/tab/tab-my.html',
                        controller: 'myCtrl'
                    }
                }
            })
            .state('tab.help', {
                url: '/help',
                // cache: false,
                views: {
                    'tab-help': {
                        templateUrl: 'templates/tab/tab-help.html',
                        controller: 'userHelpCtrl'
                    }
                }
            })
            .state('auth', {
                url: '/auth',
                abstract: 'true',
                template: '<ion-nav-view></ion-nav-view>'
            })
            .state('auth.login', {
                url: '/login',
                cache: false,
                templateUrl: 'templates/auth/login.html',
                controller: 'loginCtrl'
            })
            .state('auth.register', {
                url: '/register',
                cache: false,
                templateUrl: 'templates/auth/register.html',
                controller: 'registerCtrl'
            })
            .state('auth.resetPsd', {
                url: '/resetPsd',
                cache: false,
                templateUrl: 'templates/auth/resetPsd.html',
                controller: 'resetPsdCtrl'
            })
            .state('user', {
                url: '/user',
                abstract: 'true',
                template: '<ion-nav-view></ion-nav-view>'
            })
            .state('user.goodInfo', {
                url: '/goodInfo/:role',
                cache: false,
                param: { role: null },
                templateUrl: 'templates/user/goodInfo.html',
                controller: 'goodInfoCtrl'
            })
            .state('user.memOrderinfo', {
                url: '/memOrderinfo',
                cache: false,
                params: { orderId: '', type: null },
                templateUrl: 'templates/user/memOrderinfo.html',
                controller: 'memOrderinfoCtrl'
            })
            .state('user.createOrder', {
                url: '/createOrder',
                cache: false,
                templateUrl: 'templates/user/createOrder.html',
                controller: 'createOrderCtrl'
            })
            .state('user.pay', {
                url: '/pay',
                cache: false,
                params: { orderId: null, Price: null, memtype: '' },
                templateUrl: 'templates/user/pay.html',
                controller: 'userPayCtrl'
            })
            .state('user.orderList', {
                url: '/orderList',
                cache: false,
                params: { type: null },
                templateUrl: 'templates/user/orderList.html',
                controller: 'userOrderListCtrl'
            })
            .state('user.orderInfo', {
                url: '/orderInfo/:orderId',
                cache: false,
                params: { orderId: null, type: null },
                templateUrl: 'templates/user/orderInfo.html',
                controller: 'userOrderInfoCtrl'
            })
            .state('user.center', {
                url: '/center',
                templateUrl: 'templates/user/center.html',
                controller: 'userCenterCtrl'
            })
            .state('user.realName', {
                url: '/realName',
                cache: false,
                templateUrl: 'templates/user/realName.html',
                controller: 'userRealNameCtrl'
            })
            .state('user.loginPsw', {
                url: '/loginPsw/:type',
                params: {
                    type: null
                },
                cache: false,
                templateUrl: 'templates/user/loginPsw.html',
                controller: 'userLoginPswCtrl'
            })
            .state('user.getRealMoney', {
                url: '/getRealMoney',
                cache: false,
                templateUrl: 'templates/user/getRealMoney.html',
                controller: 'userGetRealMoneyCtrl'
            })
            .state('user.repoList', {
                url: '/repoList/:type',
                params: {
                    type: null
                },
                // cache: false,
                templateUrl: 'templates/user/repoList.html',
                controller: 'userRepoListCtrl'
            })
            .state('user.repoInfo', {
                url: '/repoInfo/:id',
                params: {
                    id: null
                },
                cache: false,
                templateUrl: 'templates/user/repoInfo.html',
                controller: 'userRepoInfoCtrl'
            })
            .state('user.moneyBack', {
                url: '/moneyBack',
                params: {
                    type: null
                },
                cache: false,
                templateUrl: 'templates/user/moneyBack.html',
                controller: 'userMoneyBackCtrl'
            })
            .state('user.recPersonDetail', {
                url: '/recPersonDetail',
                cache: false,
                templateUrl: 'templates/user/recPersonDetail.html',
                controller: 'recPersonDetailCtrl'
            })
            .state('user.recPersonProfit', {
                url: '/recPersonProfit',
                cache: false,
                templateUrl: 'templates/user/recPersonProfit.html',
                controller: 'recPersonProfitCtrl'
            })
            .state('user.recBuyProfit', {
                url: '/recBuyProfit',
                cache: false,
                templateUrl: 'templates/user/recBuyProfit.html',
                controller: 'recBuyProfitCtrl'
            })
            .state('user.userHelp', {
                url: '/userHelp',
                templateUrl: 'templates/user/userHelp.html',
                controller: 'userHelpCtrl'
            })
            .state('user.newsDetails', {
                url: '/newsDetails/:id',
                templateUrl: 'templates/user/newsDetails.html',
                controller: 'userNewsDetailsCtrl'
            })
            .state('user.resetPayWord', {
                url: '/resetPayWord',
                params: {
                    type: null
                },
                cache: false,
                templateUrl: 'templates/user/resetPayWord.html',
                controller: 'userResetPayWordCtrl'
            })
            .state('user.goodReturn', {
                url: '/goodReturn/:type',
                params: {
                    type: null
                },
                // cache: false,
                templateUrl: 'templates/user/goodReturn.html',
                controller: 'goodReturnCtrl'
            })
            .state('user.recommend', {
                url: '/recommend',
                cache: false,
                templateUrl: 'templates/user/recommend.html',
                controller: 'userRecommendCtrl'
            })



        $urlRouterProvider.otherwise('/tab/home');

    })