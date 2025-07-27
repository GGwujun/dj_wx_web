Page({
  data: {
    inputUrl: '',
    hasWatchedAd: false,
    showPopup: false,
    popupAnimation: {},
    interstitialAd: null // 用于存储插屏广告实例
  },

  onLoad: function () {
    this.showPopup();
    const hasWatchedAd = wx.getStorageSync('hasWatchedAd');
    this.setData({
      hasWatchedAd: !!hasWatchedAd
    });

    // 请求后台获取配置
    wx.request({
      url: 'https://dsx-family.site/ymq/',
      method: 'GET',
      success: (res) => {
        this.setData({
          config: res.data.data
        });
      },
      fail: () => {
        wx.showToast({
          title: '获取配置失败',
          icon: 'none'
        });
      }
    });
  },


  showPopup() {
    this.setData({
      showPopup: true
    });
    setTimeout(() => {
      this.setData({
        showPopup: false
      });
    }, 16000); // 弹窗显示16秒后消失
  },

  closePopup() {
    this.setData({
      showPopup: false
    });
  },

  // 处理文本框输入
  onInputUrl: function (e) {
    this.setData({
      inputUrl: e.detail.value
    });
  },

  // 清空内容
  onClear: function () {
    this.setData({
      inputUrl: ''
    });
  },

  onSwiperItemTap: function (event) {
    const index = event.currentTarget.dataset.index;

    const {
      appid1,
      appid2,
      appid3,
      appid4
    } = this.data.config;

    // 从后台传过来的小程序 ID 对象中获取 appId
    const appIds = {
      appid1: appid1,
      appid2: appid2,
      appid3: appid3,
      appid4: appid4 // 如果有的话
    };

    // 根据 index 从 appIds 中获取对应的 appId
    let appId;
    switch (index) {
      case '0':
        appId = appIds.appid1;
        break;
      case '1':
        appId = appIds.appid2;
        break;
      case '2':
        appId = appIds.appid3;
        break;
      case '3':
        appId = appIds.appid4;
        break;
      default:
        console.error('无效的 swiper item index');
        return; // 结束函数
    }

    // 调用 wx.navigateToMiniProgram
    wx.navigateToMiniProgram({
      appId: appId,
      path: '', // 可选，目标页面路径
      envVersion: 'release', // 可选，目标版本
      success(res) {
        console.log('跳转成功', res);
      },
      fail(err) {
        console.error('跳转失败', err);
      }
    });
  },

  // 分享按钮点击事件
  onShare() {
    // 调用微信小程序的分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 粘贴并解析链接
  onPasteAndParse: function () {
    var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
    // 解析抖音分享口令中的链接并返回列表
    function findUrl(string) {
      // 定义正则表达式，匹配 URL
      const regex = /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g;
      // 使用 match 方法获取匹配到的所有 URL
      const urlList = string.match(regex);
      // 如果没有匹配到 URL，则返回一个空数组
      return urlList || [];
    }
    const urls = findUrl(this.data.inputUrl);
    log?.info?.apply(log, ['通过输入框的粘贴内容解析视频链接：', urls]);
    if (urls && urls.length === 1) {
      this.onParse(urls[0]);
    } else if (urls && urls.length > 1) {
      wx.showToast({
        title: '目前不支持解析多个视频链接',
        icon: 'none'
      });
      return;
    } else {
      wx.getClipboardData({
        success: (res) => {
          const clipboardData = res.data;
          log?.info?.apply(log, ['粘贴板获取成功', clipboardData]);
          if (clipboardData) {
            this.setData({
              inputUrl: clipboardData
            });
            const urls2 = findUrl(this.data.inputUrl);
            log?.info?.apply(log, ['粘贴板获取成功,从中解析的视频链接', urls2]);
            if (urls2 && urls2.length === 1) {
              this.onParse(urls2[0]);
            } else if (urls2 && urls2.length > 1) {
              wx.showToast({
                title: '目前不支持解析多个视频链接',
                icon: 'none'
              });

              return;
            }
          } else {
            log?.info?.apply(log, ['粘贴板获取成功,剪贴板为空']);
            wx.showToast({
              title: '剪贴板为空',
              icon: 'none'
            });
            wx.showToast({
              title: '请输入有效的视频链接',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          log?.error?.apply(log, ['获取剪贴板内容失败', err]);
          wx.showToast({
            title: '无法获取剪贴板内容',
            icon: 'none'
          });
          console.error('获取剪贴板内容失败', err);
          wx.showToast({
            title: '请输入有效的视频链接',
            icon: 'none'
          });
        }
      });
    }
  },

  onParse: function (url) {
    var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
    if (!url) {
      wx.showToast({
        title: '请输入链接',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '解析中...'
    });
    const {
      slave_addr,
      data_field,
      code_field,
      code_num,
      title_video,
      photo_video,
      downurl_video,
    } = this.data.config;
    log?.info.apply(log, ['获取的配置信息：', slave_addr, data_field, code_num, title_video, photo_video, downurl_video])
    const platform = url.includes('douyin') ? 'douyin' : url.includes('tiktok') ? 'tiktok' : null
    if (!platform) {
      wx.showToast({
        title: '请输入正确的视频分享链接，目前只支持抖音和TikTok',
        icon: 'none'
      });
      return;
    }
    var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
    log?.info.apply(log, ['开始请求后端接口，解析视频链接：', url]);
    wx.request({
      url: `${slave_addr}${encodeURIComponent(url)}`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        const Data = res.data[data_field];
        const Code = res.data[code_field];
        const codeNumStr = String(code_num); // 将 code_num 转换为字符串
        if (Data && (String(Code) === codeNumStr)) {
          const aweme_type = Data.aweme_type;
          const url_type_code_dict = {
            0: 'video',
            // # Douyin
            2: 'image',
            4: 'video',
            68: 'image',
            // # TikTok
            51: 'video',
            55: 'video',
            58: 'video',
            61: 'video',
            150: 'image'
          }
          const url_type = url_type_code_dict[aweme_type] || 'video';
          let resultData = {};
          if (url_type === 'video') {
            log?.info?.apply(log, ['解析链接成功，处理video开始，platform=', platform])
            if (platform === 'douyin') {
              resultData = {
                title: Data.desc,
                photo: Data.video.cover.url_list[0],
                videourl: url,
                downurl: Data.video.play_addr.url_list[0].replace('playwm', 'play'),
              };
            } else if (platform === 'tiktok') {
              resultData = {
                title: Data.desc,
                photo: Data.video.cover.url_list[0],
                videourl: url,
                downurl: Data.video?.bit_rate?.[0]?.play_addr?.url_list?.[0],
              };
            }
          } else if (url_type === 'image') {
            if (platform === 'douyin') {
              const pics = Data?.images?.map(image => image['url_list'][0]) ?? []
              log?.info?.apply(log, ['解析链接成功，处理image开始，platform=', platform, pics])
              if (pics.length === 0) {
                wx.showToast({
                  title: '图片解析失败',
                  icon: 'none'
                });
              } else {
                resultData = {
                  title: Data.desc,
                  photo: Data.video.cover.url_list[0],
                  pics: pics,
                };
              }
            } else if (platform === 'tiktok') {
              const pics = Data?.image_post_info?.images?.map(image => image?.['display_image']?.url_list?.[0]) ?? []
              log?.info?.apply(log, ['解析链接成功，处理image开始，platform=', platform, pics])
              if (pics.length === 0) {
                wx.showToast({
                  title: '图片解析失败',
                  icon: 'none'
                });
              } else {
                resultData = {
                  title: Data.desc,
                  photo: Data.video.cover.url_list[0],
                  pics: pics,
                };
              }
            }
          } else {
            wx.showToast({
              title: '未知的链接解析结果',
              icon: 'none'
            });
            log?.error?.apply(log, ['未知的链接解析结果', url_type])
            return;
          }
          wx.navigateTo({
            url: `/pages/video/video?data=${encodeURIComponent(JSON.stringify(resultData))}`
          });
        } else {
          wx.showToast({
            title: res.data.msg,
            icon: 'none'
          });
          log?.error?.apply(log, ['地址解析失败，返回数据：', Data, Code])
        }
      },
      fail: (err) => {
        wx.hideLoading();
        // 发送失败邮件
        console.log("备用接口失败原因", err);
        log?.error?.apply(log, ['备用接口失败原因', err])
        wx.showToast({
          title: '备用接口请求失败，请稍后重试',
          icon: 'none'
        });
      }
    });

  },
});