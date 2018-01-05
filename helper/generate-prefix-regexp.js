#!/usr/bin/env node

// curl https://fr.wikipedia.org/wiki/Liste_des_indicatifs_t%C3%A9l%C3%A9phoniques_internationaux_par_pays | grep -E '<td align="right">[0-9]+</td>' | cut -d'>' -f2 | cut -d '<' -f1 | tr '\n' ','

var prefixList = [93,27,355,213,49,376,244,966,54,374,297,247,61,43,994,973,880,32,501,229,975,375,95,591,387,267,55,673,359,226,257,855,237,238,236,56,86,357,57,269,243,242,682,850,82,506,225,385,53,599,45,253,20,971,593,291,34,372,251,298,679,358,33,241,220,995,233,350,30,299,590,502,224,240,245,592,594,509,504,852,36,91,62,964,98,353,354,972,39,81,962,7,254,996,686,383,965,856,266,371,961,231,218,423,370,352,853,389,261,60,265,960,223,500,356,212,692,596,230,222,262,52,691,373,377,976,382,258,264,674,977,505,227,234,683,47,687,64,968,256,998,92,680,970,507,675,595,31,599,51,63,64,48,689,351,974,262,40,44,7,250,290,378,590,508,677,503,685,239,221,381,248,232,65,421,386,252,249,211,94,46,41,597,268,963,992,255,886,235,420,246,672,66,670,228,690,676,216,993,90,688,380,598,678,379,58,84,681,967,260,263,881,800];

prefixList.sort();

var tree = {};

var count = function (e) {
  if (typeof e != 'object') return 0;
  if (!e) return 0;
  var count = 0;
  for (var i in e) count++;
  return count;
};

for (var i = 0; i < prefixList.length; i++) {
  var str = '' + prefixList[i];
  for (var j = 0, p = tree; j < str.length; j++) {
    if (p[str[j]] == null) p[str[j]] = {};
    p = p[str[j]];
  }
}

var result = (function loop(tree, f) {
  var c = count(tree);
  if (c > 1) {
    var stack = [];
    for (var i in tree) stack.push(i + loop(tree[i]));
    return ('(?:' + stack.join('|') + ')').replace(/^\(\?:(?:\d\|)+\d\)$/, function (f) {
      var digits = f.replace(/[^\d]/g, '');
      return '[' + digits + ']';
    });
  } else if (c == 1) {
    for (var i in tree) return i;
  } else {
    return '';
  }
})(tree);

console.log(result);