const TIAN_GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const DI_ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const SHENG_XIAO = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
const SHI_CHEN = ["子时","丑时","寅时","卯时","辰时","巳时","午时","未时","申时","酉时","戌时","亥时"];
// ====== 基于 lunar-javascript 库的真排盘替代实现 ======
// 该文件提供 getLunarDate() 的替代实现，保持与原函数完全相同的返回值字段

function getLunarDate(year, month, day) {
  // Handle UMD export: library exports global Solar, Lunar (capital L)
  var _lunar = (typeof Lunar !== "undefined") ? {Lunar:Lunar, Solar:Solar} : 
              (typeof window !== "undefined" && window.Lunar) ? {Lunar:window.Lunar, Solar:window.Solar} : null;
  if (!_lunar) {
    // Fallback: check if the library put classes on window
    var _solar = typeof Solar !== "undefined" ? Solar : (window && window.Solar);
    if (_solar) {
      _lunar = {Solar: _solar, Lunar: typeof Lunar !== "undefined" ? Lunar : (window && window.Lunar)};
    }
  }
  if (!_lunar || !_lunar.Solar) throw new Error("lunar library not loaded - check network or script order");
  var solar = _lunar.Solar.fromYmd(year, month, day);
  var l = solar.getLunar();
  var ec = l.getEightChar();

  // 甘孜字符
  var weekDays = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];

  var yGanIdx = l.getYearGanIndexExact();
  var yZhiIdx = l.getYearZhiIndexExact();
  var dGanIdx = l.getDayGanIndex();
  var dZhiIdx = l.getDayZhiIndex();

  // 年柱
  var ganzhiYear = l.getYearInGanZhiExact();
  // 月柱 (节气为准)
  var ganzhiMonth = l.getMonthInGanZhiExact();
  // 日柱
  var ganzhiDay = l.getDayInGanZhi();
  // 生肖
  var shengxiao = l.getYearShengXiaoExact();

  // 农历月日
  var monthNames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
  var dayNames = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  var lunarMonth = l.getMonth();
  var lunarDay = l.getDay();
  var monthName = monthNames[lunarMonth - 1] || (lunarMonth + '月');
  var dayName = dayNames[lunarDay - 1] || (lunarDay + '日');
  if (l.isLeap) monthName = '闰' + monthName;

  // --- 日月质 ---
  var levels = ['上上','上吉','中吉','中平','下签','下下'];
  // 基于天神吉凶和凶煞计数判定等级
  var tianShenLuck = l.getDayTianShenLuck();
  var xiongSha = l.getDayXiongSha() || [];
  var xiongShaLen = xiongSha.length;
  var level;
  if (tianShenLuck === '吉' && xiongShaLen <= 1) level = '上上';
  else if (tianShenLuck === '吉' && xiongShaLen <= 3) level = '上吉';
  else if (tianShenLuck === '凶' && xiongShaLen <= 2) level = '中平';
  else if (tianShenLuck === '凶' && xiongShaLen >= 3) level = '下签';
  else level = '中吉';

  // 宜忌 - 从农历库获取
  var yiArr = l.getDayYi().filter(function(x) { return x !== '---'; });
  var jiArr = l.getDayJi().filter(function(x) { return x !== '---'; });

  // 神煞
  var shenshaObj = {};
  shenshaObj['吉神宜趋'] = l.getDayJiShen() || [];
  var xiongShaJoined = xiongSha.length > 0 ? xiongSha.join('、') : '无';
  shenshaObj['凶神宜避'] = xiongSha.length > 0 ? xiongSha : ['无'];
  shenshaObj['冲煞'] = '(' + l.getDayChong() + ')' + l.getDayChongShengXiao();
  // 胎神方位: 位置 + 方位 (占方+复方)
  var taiPos = l.getDayPositionTai();
  var fuPos = l.getDayPositionFu ? l.getDayPositionFu() : '';
  shenshaObj['胎神方位'] = taiPos + (taiPos !== fuPos && fuPos ? ' · ' + fuPos : '');
  // 28宿
  var xiu = l.getXiu();
  var xiuLuck = l.getXiuLuck();
  shenshaObj['28宿'] = xiu;
  shenshaObj['宿吉凶'] = xiuLuck;
  // 12建除
  var jianChu = l.getZhiXing();
  shenshaObj['12建除'] = jianChu;
  // 天星
  shenshaObj['天星'] = l.getDayTianShen();
  // 纳音
  shenshaObj['纳音'] = l.getDayNaYin();
  // 值星
  shenshaObj['值星'] = l.getDayNineStar();

  // 时辰
  var times = l.getTimes();
  var shichenArr = times.map(function(t) {
    return {
      name: t.getGanZhi(),
      range: t.getMinHm() + '-' + t.getMaxHm(),
      gan: t.getGan(),
      zhi: t.getZhi(),
      chong: t.getChongShengXiao(),
      chongAnimal: t.getChongShengXiao(),
      luck: t.getTianShenLuck()
    };
  });

  // 未来 7 日预测
  var baseDate = new Date(Date.UTC(year, month - 1, day));
  var weekForecast = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(baseDate.getTime() + i * 86400000);
    var dYear = d.getUTCFullYear();
    var dMonth = d.getUTCMonth() + 1;
    var dDay = d.getUTCDate();
    var ds = _lunar.Solar.fromYmd(dYear, dMonth, dDay);
    var dl = ds.getLunar();
    var wd = weekDays[d.getUTCDay()];
    // 未来日等级判定
    var dtl = dl.getDayTianShenLuck();
    var dxs = dl.getDayXiongSha() || [];
    var dlvl;
    if (dtl === '吉' && dxs.length <= 1) dlvl = '上上';
    else if (dtl === '吉') dlvl = '上吉';
    else if (dtl === '凶' && dxs.length <= 2) dlvl = '中平';
    else if (dtl === '凶') dlvl = '下签';
    else dlvl = '中吉';
    weekForecast.push({
      weekDay: wd,
      day: dl.getDay(),
      level: dlvl,
      lunarDay: dayNames[dl.getDay() - 1] || (dl.getDay() + '日')
    });
  }

  return {
    lunarYear: l.getYear(),
    lunarMonth: lunarMonth,
    lunarDay: lunarDay,
    isLeap: l.isLeap,
    ganzhiYear: ganzhiYear,
    ganzhiMonth: ganzhiMonth,
    ganzhiDay: ganzhiDay,
    shengxiao: shengxiao,
    yearGan: yGanIdx,
    yearZhi: yZhiIdx,
    dayGan: dGanIdx,
    dayZhi: dZhiIdx,
    level: level,
    yi: yiArr,
    ji: jiArr,
    weekDay: weekDays[solar.getWeek()],
    monthName: monthName,
    dayName: dayName,
    shensha: shenshaObj,
    shichen: shichenArr,
    weekForecast: weekForecast,
    // 农历库原始对象 (供高级功能)
    _lunar: l,
    _solar: solar,
    _ec: ec
  };
}


// Node.js require compatibility
if (typeof global !== 'undefined') { global.getLunarDate = getLunarDate; global.TIAN_GAN = TIAN_GAN; global.DI_ZHI = DI_ZHI; global.SHENG_XIAO = SHENG_XIAO; global.SHI_CHEN = SHI_CHEN; }
