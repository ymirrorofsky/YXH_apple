angular.module('starter.services', [])
  .factory('Storage', function () {
    return {
      set: function (key, data) {
        return window.localStorage.setItem(key, window.JSON.stringify(data));
      },
      get: function (key) {
        return window.JSON.parse(window.localStorage.getItem(key));
      },
      remove: function (key) {
        return window.localStorage.removeItem(key);
      }
    }
  })
  .factory('System', function ($rootScope, $http, $q, $cordovaAppVersion, $ionicPopup, ENV, $resource, Message, $window) {
    var verInfo;
    var resource = $resource(ENV.TB_URL, { do: 'config', op: '@op' });
    return {
      checkUpdate: function () {
        var deferred = $q.defer();
        $window.CordovaHttpPlugin.get(ENV.TB_URL + '&do=user&op=getVersion', {}, {}, function (res) {
          res.data = JSON.parse(res.data);
          var data = res.data
          alert(data.data.code)
          if (data.data.code != 0) {
            return;
          }
          verInfo = data.data.data;
          $cordovaAppVersion.getVersionNumber().then(function (version) {
            if (version < verInfo.version) {
              $confirmPopup = $ionicPopup.confirm({
                template: '发现新版本，是否更新版本',
                buttons: [{
                  text: '取消',
                  type: 'button-default'
                }, {
                  text: '更新',
                  type: 'button-positive',
                  onTap: function () {
                    deferred.resolve(verInfo);
                  }
                }]
              })
            } else {
              deferred.reject();
            }
          }, function () {
            Message.show('通讯失败，请检查网络')
          })
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })


        // $http.get(ENV.TB_URL + '&do=user&op=getVersion').then(function (data) {
        //   alert(data.data.code)
        //   if (data.data.code != 0) {
        //     return;
        //   }
        //   verInfo = data.data.data;
        //   $cordovaAppVersion.getVersionNumber().then(function (version) {
        //     if (version < verInfo.version) {
        //       $confirmPopup = $ionicPopup.confirm({
        //         template: '发现新版本，是否更新版本',
        //         buttons: [{
        //           text: '取消',
        //           type: 'button-default'
        //         }, {
        //           text: '更新',
        //           type: 'button-positive',
        //           onTap: function () {
        //             deferred.resolve(verInfo);
        //           }
        //         }]
        //       })
        //     } else {
        //       deferred.reject();
        //     }
        //   }, function () {
        //     Message.show('通讯失败，请检查网络')
        //   })
        // }, false)
        return deferred.promise;
      }
    }
  })
  .factory('Message', function ($ionicLoading) {
    return {
      show: function () {
        var text = arguments[0] ? arguments[0] : 'Hi，出现了一些错误，请检查网络或者退出重试！';
        var duration = arguments[1] ? arguments[1] : 1500;
        var callback = arguments[2] ? arguments[2] : '';
        $ionicLoading.hide();
        if (typeof callback === 'function') {
          $ionicLoading.show({
            noBackdrop: true,
            template: text,
            duration: duration
          }).then(function () {
            callback();
          })
        } else {
          $ionicLoading.show({
            noBackdrop: true,
            template: text,
            duration: duration
          });
        }
      },
      loading: function () {
        var text = arguments[0] ? arguments[0] : '';
        $ionicLoading.hide();
        $ionicLoading.show({

          hideOnStateChange: false,
          duration: 10000,
          template: '<ion-spinner icon="spiral" class="spinner-stable"></ion-spinner><br/>' + text
        })
      },
      hidden: function () {
        $ionicLoading.hide();
      }
    }
  })
  .factory('TokenAuth', function ($q, Storage, $location) {
    return {
      request: function (config) {
        var userInfo = Storage.get('user');
        config.headers = config.headers || {};
        if (userInfo && userInfo.token) {
          config.headers.TOKEN = userInfo.token;
        }
        return config;
      },
      response: function (response) {
        if (response.data.code === 403) {
          Storage.remove('user');
          $location.path('/auth/login');
        }
        return response || $q.when(response);
      }
    };
  })
  .factory('Area', function ($resource) {
    var resource = $resource('lib/area.json');
    return {
      getList: function (success, pid, cid) {
        resource.get({}, function (data) {
          success(data)
        })
      }
    }
  })
  .factory('Auth', function ($resource, $rootScope, $q, ENV, Message, $state, Storage, $window) {
    var resource = $resource(ENV.TB_URL + '&do=auth', { op: '@op' });
    var authUrl = ENV.TB_URL + '&do=auth';

    //检查手机号格式
    var checkMobile = function (mobile) {
      if (!ENV.REGULAR_MOBILE.test(mobile)) {
        Message.show('请输入正确的11位手机号码', 800);
        return false;
      } else {
        return true;
      }
    };
    //检查密码格式
    var checkPwd = function (pwd) {
      if (!pwd || pwd.length < 6) {
        Message.show('请输入正确的密码(最少6位)', 800);
        return false;
      }
      return true;
    };
    return {
      // 用户注册协议
      fetchAgreement: function () {
        var deferred = $q.defer();
        $window.tbGet(authUrl, { op: 'agreement' }, function (response) {
          deferred.resolve(response.data);
        }, function (err) {
          deferred.reject();
        })
        // resource.get({ op: 'agreement' }, function (response) {
        //   deferred.resolve(response.data);
        // });
        return deferred.promise;
      },
      // 登陆操作
      login: function (mobile, password) {
        if (!checkMobile(mobile)) {
          return false;
        }
        if (!checkPwd(password)) {
          return false;
        }
        Message.loading('登陆中……');
        $window.tbPost(authUrl, { op: 'login', mobile: mobile, password: password }, function (response) {
          if (response.code == 0) {
            Message.show('登陆成功', 1000);
            Storage.set("user", response.data);
            $rootScope.globalInfo.user = response.data;
            $state.go('tab.home');
          } else {
            Message.show(response.msg, 1500);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save({
        //   op: 'login',
        //   mobile: mobile,
        //   password: password
        // }, function (response) {
        //   if (response.code == 0) {
        //     Message.show('登陆成功', 1000);
        //     Storage.set("user", response.data);
        //     $rootScope.globalInfo.user = response.data;
        //     console.log($rootScope.globalInfo.user)
        //     $state.go('tab.home');
        //   } else {
        //     Message.show(response.msg, 1500);
        //   }
        // }, function () {
        //   Message.show('通信错误，请检查网络', 1500);
        // });
      },
      //发送注册验证码
      getSmsCaptcha: function (type, tMobile, mobile, pictureCaptcha) {
        if (!checkMobile(mobile)) {
          return false;
        }
        var deferred = $q.defer();
        Message.loading('加载中');
        var _json = {
          op: 'register',
          type: type,
          tMobile: tMobile,
          mobile: mobile,
          pictureCaptcha: pictureCaptcha
        }
        resource.save(_json, function (response) {
          Message.hidden();
          if (response.code !== 0) {
            Message.show(response.msg);
            deferred.reject();
            return false;
          } else {
            deferred.resolve();
          }
        });
        // if ($window.cordova) {
        //   $window.tbPost(authUrl, _json, function (response) {
        //     Message.hidden();
        //     alert(response.code)
        //     if (response.code != 0) {
        //       Message.show(response.msg);
        //       deferred.reject();   //原本的
        //       // deferred.resolve();    //测试而添加的
        //       return false;
        //     } else {
        //       deferred.resolve();
        //     }
        //   }, function (err) {
        //     Message.show('通信错误，请检查网络', 1500);
        //   })
        // } else {
        //   resource.save(_json, function (response) {
        //     Message.hidden();
        //     if (response.code !== 0) {
        //       Message.show(response.msg);
        //       deferred.reject();
        //       return false;
        //     } else {
        //       deferred.resolve();
        //     }
        //   });
        // }
        return deferred.promise;
      },
      //检查验证码
      checkCaptain: function (mobile, captcha, type) {
        if (!checkMobile(mobile)) {
          return false;
        }
        var _json = {
          op: 'register',
          type: 'verifycode',
          mobile: mobile,
          code: captcha
        };
        if (type) {
          _json = {
            op: 'forget',
            type: 'verifycode',
            mobile: mobile,
            code: captcha
          };
        }
        Message.loading();

        return $window.tbGet(authUrl, _json, function (response) {
          if (response.code !== 0) {
            Message.show(response.msg, 1500);
            return;
          }
          $rootScope.$broadcast('Captcha.success');
          Message.show(response.msg, 1000);
        }, function (err) {
          Message.show('通信错误，请检查网络！', 1500);
        })

        // return resource.get(_json, function (response) {
        //   if (response.code !== 0) {
        //     Message.show(response.msg, 1500);
        //     //						Deferred.resolve()
        //     return;
        //   }
        //   $rootScope.$broadcast('Captcha.success');
        //   Message.show(response.msg, 1000);
        // }, function() {
        //   Message.show('通信错误，请检查网络！', 1500);
        // });
      },
      /*设置密码*/
      setPassword: function (reg, type) {
        if (reg.password.length < 6) {
          Message.show('密码长度不能小于6位！', 1500);
          return false;
        }
        if (reg.password != reg.rePassword) {
          Message.show('两次密码不一致，请检查！', 1500);
          return false;
        }
        var _json = {
          op: 'register',
          tMobile: reg.tMobile,
          mobile: reg.mobile,
          password: reg.password,
          repassword: reg.rePassword,
          code: reg.captcha
        };
        console.log(reg.mobile);
        if (type) {
          _json = {
            op: 'forget',
            mobile: reg.mobile,
            password: reg.password,
            repassword: reg.rePassword,
            code: reg.captcha
          };
        }
        Message.loading();

        $window.tbPost(authUrl, _json, function (response) {
          if (response.code !== 0) {
            Message.show(response.msg, 1500);
            return;
          }
          $state.go('auth.login');
          Message.show(response.msg, 1500);
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // return resource.save(_json, function (response) {
        //   if (response.code !== 0) {
        //     Message.show(response.msg, 1500);
        //     return;
        //   }
        //   $state.go('auth.login');
        //   Message.show(response.msg, 1500);
        // }, function () {
        //   Message.show('通信错误，请检查网络！', 1500);
        // });
      },
      //忘记密码获取验证码
      getCaptcha: function (success, error, mobile) {
        if (!checkMobile(mobile)) {
          return false;
        }
        var _json = {
          op: 'forget',
          type: 'send',
          mobile: mobile
        };
        Message.loading();

        if ($window.cordova) {
          $window.tbPost(authUrl, _json, success, error)
        } else {
          resource.save(_json, success, error);
        }

      },
    }
  })
  .factory('User', function ($resource, $rootScope, $q, ENV, Message, $state, Storage, $window, $timeout) {
    var resource = $resource(ENV.TB_URL + '&do=user', { op: '@op' });
    var userUrl = ENV.TB_URL + '&do=user'
    return {
      checkAuth: function () {
        return (Storage.get('user') && Storage.get('user').uid != '');
      },
      /*退出登录*/
      logout: function () {
        Storage.remove('user');
        $rootScope.globalInfo.user = { uid: false };
        Message.show('退出成功！', '1500', function () {
        });
      },
      //获取首页数据
      getHome: function () {
          var deferred = $q.defer();
          Message.loading();
          $window.tbPost(ENV.TB_URL + '&do=config', { op: 'getHome' }, function (response) {
            Message.hidden();
            if (response.code == 0) {
              deferred.resolve(response.data);
            } else if (response.code == 1) {
              Message.show(response.msg);
            }
          }, function (err) {
            Message.show('通信错误，请检查网络', 1500);
          })
          return deferred.promise;
        // var res = $resource(ENV.TB_URL + '&do=config', { op: '@op' });
        // res.save({ op: 'getHome' }, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // });

      },
      getFirstHome: function (success, fail) {
        $timeout(function () {
          Message.loading();
          $window.tbPost(ENV.TB_URL + '&do=config', { op: 'getHome' }, function (response) {
            Message.hidden();
            if (response.code == 0) {
              success(response.data)
            } else if (response.code == 1) {
              Message.show(response.msg);
            }
          }, function (err) {
            Message.show('通信错误，请检查网络', 1500);
          })
        }, 500)
      },
      //获取会员级别
      getrole: function () {
        var deferred = $q.defer();
        Message.loading();
        $window.tbPost(userUrl, { op: 'getrole' }, function (response) {
          Message.hidden();
          deferred.resolve(response);
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save({ op: 'getrole' }, function (response) {
        //   Message.hidden();
        //   deferred.resolve(response);
        // });
        return deferred.promise;
      },
      //获取会员商品信息
      getGoodInfo: function (cid) {
        var deferred = $q.defer();
        $window.tbPost(ENV.TB_URL + '&do=config', { op: 'goodInfo', cid: cid }, function (response) {
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg)
            deferred.reject();
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.save({ op: 'goodInfo', cid: cid }, function (response) {
        //   if (response.code == 0) {         
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg)
        //     deferred.reject();
        //   }

        // });
        return deferred.promise;
      },
      //获取个人信息
      getSettingInfo: function () {
        var deferred = $q.defer();
        var _json = {
          op: 'getSettingInfo',
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      //设置个人信息
      settingInfo: function (info) {
        var deferred = $q.defer();
        var _json = {
          op: 'settingInfo',
          realName: info.realname,
          gender: info.gender
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
            Message.show(response.msg);
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //     Message.show(response.msg);
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      // 修改登录及支付密码 获取验证码
      getCaptcha: function (oldpsd, newpsd, respsd, type) {
        var _json = {};
        Message.loading();
        var deferred = $q.defer();
        if (type == 1) {
          _json = {
            op: 'updatePassword',
            type: 'send',
            userPassword: oldpsd,
            password: newpsd,
            repassword: respsd
          }
        } else if (type == 2) {
          _json = {
            op: 'updatePayPassword',
            type: 'send',
            userPassword: oldpsd,
            password: newpsd,
            repassword: respsd
          }
        }
        $window.tbPost(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
            Message.show(response.msg);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })



        // resource.save(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //     Message.show(response.msg);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // }, function () {
        //   Message.show('通信错误，请检查网络!', 1500);
        // });
        return deferred.promise;
      },
      // 修改登录密码
      changeLoginPsd: function (oldpsd, code, newpsd, respsd) {
        Message.loading();
        var deferred = $q.defer();
        var _json = {
          op: 'updatePassword',
          userPassword: oldpsd,
          code: code,
          password: newpsd,
          repassword: respsd
        };

        $window.tbPost(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
            Message.show(response.msg);
          } else if (response.code == 301) {
            Message.show(response.msg);
            $state.go('user.center');
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //     Message.show(response.msg);
        //   } else if (response.code == 301) {
        //     Message.show(response.msg);
        //     $state.go('user.center');
        //   } else {
        //     Message.show(response.msg);
        //   }
        // }, function () {
        //   Message.show('通信错误，请检查网络!', 1500);
        // });
        return deferred.promise;
      },
      // 修改支付密码
      changePayPsd: function (oldpsd, code, newpsd, respsd) {
        Message.loading();
        var deferred = $q.defer();
        var _json = {
          op: 'updatePayPassword',
          userPassword: oldpsd,
          code: code,
          password: newpsd,
          repassword: respsd
        };
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else if (response.code == 301) {
            Message.show(response.msg);
            $state.go('user.center');
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else if (response.code == 301) {
        //     Message.show(response.msg);
        //     $state.go('user.center');
        //   } else {
        //     Message.show(response.msg);
        //   }
        // }, function () {
        //   Message.show('通信错误，请检查网络!', 1500);
        // });
        return deferred.promise;
      },
      //获取提现须知
      MoneyNote: function () {
        var deferred = $q.defer();
        var _json = {
          op: 'MoneyNote',
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg);
        //   }  
        // });
        return deferred.promise;
      },
      //获取提现信息
      getRealMoneytotal: function () {
        var shopUser = Storage.get('user')
        var deferred = $q.defer();
        var _json = {};
        _json = {
          op: 'getRealMoneytotal',
          uid: shopUser.uid,
          role: shopUser.role
        };
        Message.loading();
        $window.tbPost(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      //提现申请
      applyRealMoney: function (info) {
        var deferred = $q.defer();
        var _json = {};
        _json = {
          op: 'applyRealMoney',
          bankName: info.bankName,
          bankCard: info.bankCard,
          bankUserName: info.bankUserName,
          bankMobile: info.bankMobile,
          takeMoney: info.takeMoney,
          // count: info.cost.count
        };
        Message.loading();
        $window.tbPost(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      // 提现列表
      getRepoList: function (type, page) {
        var shopUser = Storage.get('user')
        var deferred = $q.defer();
        page = page || 1;
        Message.loading();
        $window.tbPost(userUrl, { op: 'withdrawList', type: type, page: page, uid: shopUser.uid }, function (response) {
          Message.hidden();
          deferred.resolve(response);
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save({ op: 'withdrawList', type: type, page: page, uid: shopUser.uid }, function (response) {
        //   Message.hidden();
        //   deferred.resolve(response);
        // });
        return deferred.promise;
      },
      // 提现单
      getRepoInfo: function (id) {
        var shopUser = Storage.get('user')
        var deferred = $q.defer();
        Message.loading();
        $window.tbPost(userUrl, { op: 'getWithdrawInfo', id: id }, function (response) {
          Message.hidden();
          if (response.code == 1) {
            Message.show(response.msg);
            return;
          }
          deferred.resolve(response);
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.save({ op: 'getWithdrawInfo', id: id }, function (response) {
        //   Message.hidden();
        //   deferred.resolve(response);
        //   if (response.code == 1) {
        //     Message.show(response.msg);
        //     return;
        //   }
        // });
        return deferred.promise;
      },
      //获取我的信息
      getMyInfo: function () {
        var shopUser = Storage.get('user')
        var deferred = $q.defer();
        var _json = {
          op: 'myInfo',
          uid: shopUser.uid,
        }
        Message.loading();
        $window.tbGet(ENV.TB_URL + '&do=user', _json, function (response) {
          Message.hidden();
          deferred.resolve(response.data);
        }, function (err) {
          deferred.reject();
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }

        // });
        return deferred.promise;
      },
      //获取推荐下级总数
      fetchRecPerson: function () {
        var deferred = $q.defer();
        var _json = {
          op: 'recPerson',
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      //获取推荐下级列表
      fetchRecPersonList: function (role, page) {
        var deferred = $q.defer();
        page = page || 1;
        var _json = {
          op: 'recPersonList',
          role: role,
          page: page
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      //获取推荐下级会员总收益
      fetchRecProfit: function () {
        var deferred = $q.defer();
        var _json = {
          op: 'recProfit',
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      //获取推荐下级会员收益列表
      fetchRecProfitList: function (select, page) {
        var deferred = $q.defer();
        page = page || 1;
        var _json = {
          op: 'recProfitList',
          role: select,
          page: page
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },

      //获取推荐下级会员消费总收益
      fetchRecBProfit: function (select, page) {
        var deferred = $q.defer();
        var _json = {
          op: 'recBuyProfit',
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      //获取推荐下级会员消费收益列表
      fetchRecBProfitList: function (select, page) {
        var deferred = $q.defer();
        page = page || 1;
        var _json = {
          op: 'recBuyProfitList',
          role: select,
          page: page
        }
        Message.loading();
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      // 用户帮助列表
      useHelp: function (page) {
        var deferred = $q.defer();
        page = page || 1
        var _json = {
          op: 'helpList',
          page : page
        };
        Message.loading();
        $window.tbGet(ENV.TB_URL + '&do=config', _json, function (response) {
          
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        //   var res = $resource(ENV.TB_URL + '&do=config', { op: '@op' });
        // res.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else {
        //     Message.show(response.msg);
        //   }

        // }, function () {
        //   Message.show('通信错误，请检查网络!', 1500);
        // });
        return deferred.promise;
      },
      // 用户帮助列表详情
      helpInfo: function (id) {
        var deferred = $q.defer();
        var _json = {
          op: 'helpInfo',
          id: id
        };
        Message.loading();
        $window.tbGet(ENV.TB_URL + '&do=config', _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg);
        //   }

        // }, function () {
        //   Message.show('通信错误，请检查网络!', 1500);
        // });
        return deferred.promise;
      },
      // 忘记支付密码获取验证码
      resetPwd: function (newpsd, respsd) {
        Message.loading();
        var deferred = $q.defer();
        var _json = {
          op: 'forgetPayPassword',
          type: 'send',
          password: newpsd,
          repassword: respsd
        }
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
            Message.show(response.msg);
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //     Message.show(response.msg);
        //   } else {
        //     Message.show(response.msg);
        //   }
        // }, function () {
        //   Message.show('通信错误，请检查网络!', 1500);
        // });
        return deferred.promise;
      },
      // 忘记支付密码提交修改
      resetPayPsd: function (newpsd, respsd, code) {
        Message.loading();
        var deferred = $q.defer();
        var _json = {
          op: 'forgetPayPassword',
          code: code,
          password: newpsd,
          repassword: respsd
        }
        $window.tbGet(userUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else if (response.code == 301) {
            Message.show(response.msg);
            $state.go('user.center');
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else if (response.code == 301) {
        //     Message.show(response.msg);
        //     $state.go('user.center');
        //   } else {
        //     Message.show(response.msg);
        //   }
        // }, function () {
        //   Message.show('通信错误，请检查网络!', 1500);
        // });
        return deferred.promise;
      },
      //获取推荐二维码
      recomCode: function () {
        var deferred = $q.defer();
        Message.loading();
        $window.tbPost(userUrl, { op: 'getQrcode' }, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data)
          } else {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save({ op: 'getQrcode' }, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data)
        //   } else {
        //     Message.show(response.msg);
        //   }
        // })
        return deferred.promise;
      }


    }
  })
  .factory('Order', function ($resource, $rootScope, $q, ENV, Message, $state, Storage, $ionicPopup, $window) {
    var resource = $resource(ENV.TB_URL + '&do=order', { op: '@op' });
    var orderUrl = ENV.TB_URL + '&do=order';
    return {
      //获取下单平台
      getPlatform: function () {
        var deferred = $q.defer();
        Message.loading();
        $window.tbPost(orderUrl, { op: 'getPlatform' }, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response.data);
          } else {
            Message.show(response.msg)
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.save({ op: 'getPlatform' }, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response.data);
        //   } else {
        //     Message.show(response.msg)
        //   }
        // })
        return deferred.promise;
      },
      //下单
      create: function (payInfo) {
        var deferred = $q.defer();
        var _json = {
          op: 'create',
          goodsName: payInfo.goodName,
          price: payInfo.price,
          realname: payInfo.realname,
          mobile: payInfo.mobile,
          id: payInfo.id,
          thumbs: payInfo.img,
          message: payInfo.message,
        }
        $window.tbPost(orderUrl, _json, function (response) {
          if (response.code == 0) {
            Message.show(response.msg)
            deferred.resolve(response.data);
          } else if (response.code == 3) {
            var alertPopup = $ionicPopup.alert({
              title: '提示',
              template: '本月提交订单金额累计超过最大限度',
              okText: '确定'
            });
            alertPopup.then(function (res) {
              return false;
            });
          } else {
            Message.show(response.msg)
            deferred.reject();
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save(_json, function (response) {
        //   if (response.code == 0) {
        //     Message.show(response.msg)
        //     deferred.resolve(response.data);
        //   } else if (response.code == 3) {
        //     var alertPopup = $ionicPopup.alert({
        //       title: '提示',
        //       template: '本月提交订单金额累计超过最大限度',
        //       okText: '确定'
        //     });
        //     alertPopup.then(function (res) {
        //       return false;
        //     });
        //   } else {
        //     Message.show(response.msg)
        //     deferred.reject();
        //   }
        // });
        return deferred.promise;
      },
      //创建会员商品订单
      memcreate: function (info, area) {
        console.log(info)
        var deferred = $q.defer();
        var _json = {
          op: 'becomeMumber',
          id: info.id,
          realname: info.realname,
          mobile: info.mobile,
          address: info.address,
          birth: area,
          message: info.message
        }
        $window.tbPost(orderUrl, _json, function (response) {
          Message.hidden();
          deferred.resolve(response);
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save(_json, function (response) {
        //   Message.hidden();
        //   deferred.resolve(response);
        // });
        return deferred.promise;
      },
      //获取订单列表
      getList: function (type, page) {
        var deferred = $q.defer();
        page = page || 1;
        var _json = {
          op: 'getList',
          type: type,
          page: page
        };
        Message.loading();
        $window.tbPost(orderUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else {
            Message.show(response.msg);
            deferred.reject();
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.save(_json, function (response) {
        //   Message.hidden();
        //   console.log(response);
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else {
        //     Message.show(response.msg);
        //     deferred.reject();
        //   }

        // });
        return deferred.promise;
      },
      //获取会员商品订单详情
      getmemorderInfo: function (orderId) {
        var deferred = $q.defer();
        var _json = {
          op: 'memorderInfo',
          orderId: orderId,
        }
        Message.loading();
        $window.tbGet(orderUrl, _json, function (response) {
          Message.hidden();
          deferred.resolve(response);
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   deferred.resolve(response);
        // });
        return deferred.promise;
      },
      //获取订单详情
      getInfo: function (orderId) {
        var deferred = $q.defer();
        var _json = {
          op: 'getInfo',
          orderId: orderId,
        }
        Message.loading();
        $window.tbGet(orderUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // });
        return deferred.promise;
      },
      //确认收货
      sureGet: function (orderId) {
        var deferred = $q.defer();
        var _json = {
          op: 'sureGet',
          orderId: orderId,
        }
        Message.loading();
        $window.tbGet(orderUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve();
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })

        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve();
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // })
        return deferred.promise;
      },
      //完成订单
      sureFinish: function (orderId) {
        var deferred = $q.defer();
        var _json = {
          op: 'sureFinish',
          orderId: orderId,
        }
        Message.loading();
        $window.tbGet(orderUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve();
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve();
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // })
        return deferred.promise;
      },
      //激励明细
      getMoneyBack: function (time, page) {
        var shopUser = Storage.get('user')
        var deferred = $q.defer();
        page = page || 1;
        var _json = {
          op: 'moneyBack',
          spid: shopUser.uid,
          page: page
        }
        Message.loading();
        $window.tbGet(orderUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }

        // });
        return deferred.promise;
      },
      //申请退货
      return: function (orderInfo) {
        console.log(orderInfo)
        var deferred = $q.defer();
        var _json = {
          op: 'return',
          orderId: orderInfo.orderId,
          returnMsg: orderInfo.returnMsg
        }
        Message.loading();
        $window.tbGet(orderUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve();
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve();
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // })
        return deferred.promise;
      },
      //获取退货列表
      getGoodReturn: function (reSelect, page) {
        var deferred = $q.defer();
        page = page || 1;
        var _json = {
          op: 'getGoodReturn',
          reSelect: reSelect,
          page: page
        }
        Message.loading();
        $window.tbGet(orderUrl, _json, function (response) {
          Message.hidden();
          if (response.code == 0) {
            deferred.resolve(response);
          } else if (response.code == 1) {
            Message.show(response.msg);
          }
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })
        // resource.get(_json, function (response) {
        //   Message.hidden();
        //   if (response.code == 0) {
        //     deferred.resolve(response);
        //   } else if (response.code == 1) {
        //     Message.show(response.msg);
        //   }
        // })
        return deferred.promise;
      },
      // 提现列表
      // getRepoList: function (type, page) {
      //   var shopUser = Storage.get('user')
      //   var deferred = $q.defer();
      //   page = page || 1;
      //   Message.loading();
      //   resource.save({ op: 'withdrawList', type: type, page: page, uid: shopUser.uid }, function (response) {
      //     Message.hidden();
      //     deferred.resolve(response);
      //   });
      //   return deferred.promise;
      // },


    }
  })
  .factory('Payment', function ($resource, $rootScope, $ionicLoading, ENV, Message, $state, $ionicPopup, $ionicHistory, $window) {
    var payType = {};
    var resource = $resource(ENV.TB_URL + '&do=payment');
    var paymentUrl = ENV.TB_URL + '&do=payment';
    return {
      // 支付宝支付
      alipay: function (model, info, ordertype) {
        var _json = {};
        if (model == 'welfare') {
          if (ordertype && ordertype == 'goods') {
            _json = {
              op: 'getAlipay', /*, uid: userInfo.uid, signature: sign.signature, timestamp: sign.timestamp*/
              model: 'welfare',
              price: info.price,
              orderId: info.orderId,
              uid: $rootScope.globalInfo.user.uid,
              type: ordertype
            }
          } else {
            _json = {
              op: 'getAlipay', /*, uid: userInfo.uid, signature: sign.signature, timestamp: sign.timestamp*/
              model: 'welfare',
              price: info.price,
              orderId: info.orderId,
              uid: $rootScope.globalInfo.user.uid,
            }
          }
        }
        $window.tbGet(paymentUrl, _json, function (response) {
          var payInfo = response.data.payInfo;
          document.addEventListener("deviceready", function () {
            cordova.plugins.alipay.payment(payInfo, function (successResults) {
              if (successResults.resultStatus == "9000") {
                var alertPopup = $ionicPopup.alert({
                  title: '提示!',
                  template: '支付成功'
                });
                alertPopup.then(function (res) {
                  $ionicHistory.clearCache().then(function () { $state.go('tab.my') })
                });
              }
            }, function (errorResults) {
              Message.show('支付失败')
            });
          }, false);
        }, function (err) {
          Message.show('通信错误，请检查网络', 1500);
        })



        // resource.get(_json, function (response) {
        //   console.log(response)
        //   payInfo = response.data.payInfo;
        //   console.log(payInfo)
        //   // var alertPopup = $ionicPopup.alert({
        //   //   title: '提示!',
        //   //   template: '模拟支付成功'
        //   // });
        //   // alertPopup.then(function (res) {
        //   //   $ionicHistory.clearCache().then(function () { $state.go('tab.my') })
        //   // });
        //   document.addEventListener("deviceready", function () {
        //     cordova.plugins.alipay.payment(payInfo, function (successResults) {
        //       if (successResults.resultStatus == "9000") {
        //         // Message.show("支付成功");
        //         // 一个提示对话框

        //         var alertPopup = $ionicPopup.alert({
        //           title: '提示!',
        //           template: '支付成功'
        //         });
        //         alertPopup.then(function (res) {
        //           $ionicHistory.clearCache().then(function () { $state.go('tab.my') })
        //         });

        //       }
        //     }, function (errorResults) {

        //       Message.show()
        //     });
        //   }, false);
        // }, function () {
        //   Message.show("通信超时，请重试！");
        // })

      }
    }
  })
