(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dl = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3_dsv = {})));
}(this, function (exports) { 'use strict';

  function dsv(delimiter) {
    return new Dsv(delimiter);
  }

  function objectConverter(columns) {
    return new Function("d", "return {" + columns.map(function(name, i) {
      return JSON.stringify(name) + ": d[" + i + "]";
    }).join(",") + "}");
  }

  function customConverter(columns, f) {
    var object = objectConverter(columns);
    return function(row, i) {
      return f(object(row), i, columns);
    };
  }

  // Compute unique columns in order of discovery.
  function inferColumns(rows) {
    var columnSet = Object.create(null),
        columns = [];

    rows.forEach(function(row) {
      for (var column in row) {
        if (!(column in columnSet)) {
          columns.push(columnSet[column] = column);
        }
      }
    });

    return columns;
  }

  function Dsv(delimiter) {
    var reFormat = new RegExp("[\"" + delimiter + "\n]"),
        delimiterCode = delimiter.charCodeAt(0);

    this.parse = function(text, f) {
      var convert, columns, rows = this.parseRows(text, function(row, i) {
        if (convert) return convert(row, i - 1);
        columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
      });
      rows.columns = columns;
      return rows;
    };

    this.parseRows = function(text, f) {
      var EOL = {}, // sentinel value for end-of-line
          EOF = {}, // sentinel value for end-of-file
          rows = [], // output rows
          N = text.length,
          I = 0, // current character index
          n = 0, // the current line number
          t, // the current token
          eol; // is the current token followed by EOL?

      function token() {
        if (I >= N) return EOF; // special case: end of file
        if (eol) return eol = false, EOL; // special case: end of line

        // special case: quotes
        var j = I, c;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, "\"");
        }

        // common case: find next delimiter or newline
        while (I < N) {
          var k = 1;
          c = text.charCodeAt(I++);
          if (c === 10) eol = true; // \n
          else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
          else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }

        // special case: last token before EOF
        return text.slice(j);
      }

      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }

      return rows;
    }

    this.format = function(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
        return columns.map(function(column) {
          return formatValue(row[column]);
        }).join(delimiter);
      })).join("\n");
    };

    this.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };

    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }

    function formatValue(text) {
      return reFormat.test(text) ? "\"" + text.replace(/\"/g, "\"\"") + "\"" : text;
    }
  }

  dsv.prototype = Dsv.prototype;

  var csv = dsv(",");
  var tsv = dsv("\t");

  var version = "0.1.14";

  exports.version = version;
  exports.dsv = dsv;
  exports.csv = csv;
  exports.tsv = tsv;

}));
},{}],3:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('d3-format', ['exports'], factory) :
  factory((global.d3_format = {}));
}(this, function (exports) { 'use strict';

  // Computes the decimal coefficient and exponent of the specified number x with
  // significant digits p, where x is positive and p is in [1, 21] or undefined.
  // For example, formatDecimal(1.23) returns ["123", 0].
  function formatDecimal(x, p) {
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
    var i, coefficient = x.slice(0, i);

    // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
    // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  };

  function exponent(x) {
    return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
  };

  function formatGroup(grouping, thousands) {
    return function(value, width) {
      var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }

      return t.reverse().join(thousands);
    };
  };

  var prefixExponent;

  function formatPrefixAuto(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient
        : i > n ? coefficient + new Array(i - n + 1).join("0")
        : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
        : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
  };

  function formatRounded(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
        : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  };

  function formatDefault(x, p) {
    x = x.toPrecision(p);

    out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (x[i]) {
        case ".": i0 = i1 = i; break;
        case "0": if (i0 === 0) i0 = i; i1 = i; break;
        case "e": break out;
        default: if (i0 > 0) i0 = 0; break;
      }
    }

    return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
  };

  var formatTypes = {
    "": formatDefault,
    "%": function(x, p) { return (x * 100).toFixed(p); },
    "b": function(x) { return Math.round(x).toString(2); },
    "c": function(x) { return x + ""; },
    "d": function(x) { return Math.round(x).toString(10); },
    "e": function(x, p) { return x.toExponential(p); },
    "f": function(x, p) { return x.toFixed(p); },
    "g": function(x, p) { return x.toPrecision(p); },
    "o": function(x) { return Math.round(x).toString(8); },
    "p": function(x, p) { return formatRounded(x * 100, p); },
    "r": formatRounded,
    "s": formatPrefixAuto,
    "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
    "x": function(x) { return Math.round(x).toString(16); }
  };

  // [[fill]align][sign][symbol][0][width][,][.precision][type]
  var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

  function formatSpecifier(specifier) {
    return new FormatSpecifier(specifier);
  };

  function FormatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

    var match,
        fill = match[1] || " ",
        align = match[2] || ">",
        sign = match[3] || "-",
        symbol = match[4] || "",
        zero = !!match[5],
        width = match[6] && +match[6],
        comma = !!match[7],
        precision = match[8] && +match[8].slice(1),
        type = match[9] || "";

    // The "n" type is an alias for ",g".
    if (type === "n") comma = true, type = "g";

    // Map invalid types to the default format.
    else if (!formatTypes[type]) type = "";

    // If zero fill is specified, padding goes after sign and before digits.
    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

    this.fill = fill;
    this.align = align;
    this.sign = sign;
    this.symbol = symbol;
    this.zero = zero;
    this.width = width;
    this.comma = comma;
    this.precision = precision;
    this.type = type;
  }

  FormatSpecifier.prototype.toString = function() {
    return this.fill
        + this.align
        + this.sign
        + this.symbol
        + (this.zero ? "0" : "")
        + (this.width == null ? "" : Math.max(1, this.width | 0))
        + (this.comma ? "," : "")
        + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
        + this.type;
  };

  var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

  function identity(x) {
    return x;
  }

  function locale(locale) {
    var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity,
        currency = locale.currency,
        decimal = locale.decimal;

    function format(specifier) {
      specifier = formatSpecifier(specifier);

      var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          type = specifier.type;

      // Compute the prefix and suffix.
      // For SI-prefix, the suffix is lazily computed.
      var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
          suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

      // What format function should we use?
      // Is this an integer type?
      // Can this type generate exponential notation?
      var formatType = formatTypes[type],
          maybeSuffix = !type || /[defgprs%]/.test(type);

      // Set the default precision if not specified,
      // or clamp the specified precision to the supported range.
      // For significant precision, it must be in [1, 21].
      // For fixed precision, it must be in [0, 20].
      precision = precision == null ? (type ? 6 : 12)
          : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
          : Math.max(0, Math.min(20, precision));

      return function(value) {
        var valuePrefix = prefix,
            valueSuffix = suffix;

        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;

          // Convert negative to positive, and compute the prefix.
          // Note that -0 is not less than 0, but 1 / -0 is!
          var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

          // Perform the initial formatting.
          value = formatType(value, precision);

          // If the original value was negative, it may be rounded to zero during
          // formatting; treat this as (positive) zero.
          if (valueNegative) {
            var i = -1, n = value.length, c;
            valueNegative = false;
            while (++i < n) {
              if (c = value.charCodeAt(i), (48 < c && c < 58)
                  || (type === "x" && 96 < c && c < 103)
                  || (type === "X" && 64 < c && c < 71)) {
                valueNegative = true;
                break;
              }
            }
          }

          // Compute the prefix and suffix.
          valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

          // Break the formatted value into the integer “value” part that can be
          // grouped, and fractional or exponential “suffix” part that is not.
          if (maybeSuffix) {
            var i = -1, n = value.length, c;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }

        // If the fill character is not "0", grouping is applied before padding.
        if (comma && !zero) value = group(value, Infinity);

        // Compute the padding.
        var length = valuePrefix.length + value.length + valueSuffix.length,
            padding = length < width ? new Array(width - length + 1).join(fill) : "";

        // If the fill character is "0", grouping is applied after padding.
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

        // Reconstruct the final output based on the desired alignment.
        switch (align) {
          case "<": return valuePrefix + value + valueSuffix + padding;
          case "=": return valuePrefix + padding + value + valueSuffix;
          case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
        }
        return padding + valuePrefix + value + valueSuffix;
      };
    }

    function formatPrefix(specifier, value) {
      var f = format((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
      return function(value) {
        return f(k * value) + prefix;
      };
    }

    return {
      format: format,
      formatPrefix: formatPrefix
    };
  };

  var defaultLocale = locale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });

  var caES = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["", "\xa0€"]
  });

  var csCZ = locale({
    decimal: ",",
    thousands: "\xa0",
    grouping: [3],
    currency: ["", "\xa0Kč"],
  });

  var deCH = locale({
    decimal: ",",
    thousands: "'",
    grouping: [3],
    currency: ["", "\xa0CHF"]
  });

  var deDE = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["", "\xa0€"]
  });

  var enCA = locale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });

  var enGB = locale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["£", ""]
  });

  var esES = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["", "\xa0€"]
  });

  var fiFI = locale({
    decimal: ",",
    thousands: "\xa0",
    grouping: [3],
    currency: ["", "\xa0€"]
  });

  var frCA = locale({
    decimal: ",",
    thousands: "\xa0",
    grouping: [3],
    currency: ["", "$"]
  });

  var frFR = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["", "\xa0€"]
  });

  var heIL = locale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["₪", ""]
  });

  var huHU = locale({
    decimal: ",",
    thousands: "\xa0",
    grouping: [3],
    currency: ["", "\xa0Ft"]
  });

  var itIT = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["€", ""]
  });

  var jaJP = locale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["", "円"]
  });

  var koKR = locale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["₩", ""]
  });

  var mkMK = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["", "\xa0ден."]
  });

  var nlNL = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["€\xa0", ""]
  });

  var plPL = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["", "zł"]
  });

  var ptBR = locale({
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["R$", ""]
  });

  var ruRU = locale({
    decimal: ",",
    thousands: "\xa0",
    grouping: [3],
    currency: ["", "\xa0руб."]
  });

  var svSE = locale({
    decimal: ",",
    thousands: "\xa0",
    grouping: [3],
    currency: ["", "SEK"]
  });

  var zhCN = locale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["¥", ""]
  });

  function precisionFixed(step) {
    return Math.max(0, -exponent(Math.abs(step)));
  };

  function precisionPrefix(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
  };

  function precisionRound(step, max) {
    step = Math.abs(step), max = Math.abs(max) - step;
    return Math.max(0, exponent(max) - exponent(step)) + 1;
  };

  var format = defaultLocale.format;
  var formatPrefix = defaultLocale.formatPrefix;

  var version = "0.4.2";

  exports.version = version;
  exports.format = format;
  exports.formatPrefix = formatPrefix;
  exports.locale = locale;
  exports.localeCaEs = caES;
  exports.localeCsCz = csCZ;
  exports.localeDeCh = deCH;
  exports.localeDeDe = deDE;
  exports.localeEnCa = enCA;
  exports.localeEnGb = enGB;
  exports.localeEnUs = defaultLocale;
  exports.localeEsEs = esES;
  exports.localeFiFi = fiFI;
  exports.localeFrCa = frCA;
  exports.localeFrFr = frFR;
  exports.localeHeIl = heIL;
  exports.localeHuHu = huHU;
  exports.localeItIt = itIT;
  exports.localeJaJp = jaJP;
  exports.localeKoKr = koKR;
  exports.localeMkMk = mkMK;
  exports.localeNlNl = nlNL;
  exports.localePlPl = plPL;
  exports.localePtBr = ptBR;
  exports.localeRuRu = ruRU;
  exports.localeSvSe = svSE;
  exports.localeZhCn = zhCN;
  exports.formatSpecifier = formatSpecifier;
  exports.precisionFixed = precisionFixed;
  exports.precisionPrefix = precisionPrefix;
  exports.precisionRound = precisionRound;

}));
},{}],4:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-time')) :
  typeof define === 'function' && define.amd ? define('d3-time-format', ['exports', 'd3-time'], factory) :
  factory((global.d3_time_format = {}),global.d3_time);
}(this, function (exports,d3Time) { 'use strict';

  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }

  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }

  function newYear(y) {
    return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
  }

  function locale$1(locale) {
    var locale_dateTime = locale.dateTime,
        locale_date = locale.date,
        locale_time = locale.time,
        locale_periods = locale.periods,
        locale_weekdays = locale.days,
        locale_shortWeekdays = locale.shortDays,
        locale_months = locale.months,
        locale_shortMonths = locale.shortMonths;

    var periodRe = formatRe(locale_periods),
        periodLookup = formatLookup(locale_periods),
        weekdayRe = formatRe(locale_weekdays),
        weekdayLookup = formatLookup(locale_weekdays),
        shortWeekdayRe = formatRe(locale_shortWeekdays),
        shortWeekdayLookup = formatLookup(locale_shortWeekdays),
        monthRe = formatRe(locale_months),
        monthLookup = formatLookup(locale_months),
        shortMonthRe = formatRe(locale_shortMonths),
        shortMonthLookup = formatLookup(locale_shortMonths);

    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "S": formatSeconds,
      "U": formatWeekNumberSunday,
      "w": formatWeekdayNumber,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };

    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "S": formatUTCSeconds,
      "U": formatUTCWeekNumberSunday,
      "w": formatUTCWeekdayNumber,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };

    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "S": parseSeconds,
      "U": parseWeekNumberSunday,
      "w": parseWeekdayNumber,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };

    // These recursive directive definitions must be deferred.
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);

    function newFormat(specifier, formats) {
      return function(date) {
        var string = [],
            i = -1,
            j = 0,
            n = specifier.length,
            c,
            pad,
            format;

        if (!(date instanceof Date)) date = new Date(+date);

        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
            else pad = c === "e" ? " " : "0";
            if (format = formats[c]) c = format(date, pad);
            string.push(c);
            j = i + 1;
          }
        }

        string.push(specifier.slice(j, i));
        return string.join("");
      };
    }

    function newParse(specifier, newDate) {
      return function(string) {
        var d = newYear(1900),
            i = parseSpecifier(d, specifier, string += "", 0);
        if (i != string.length) return null;

        // The am-pm flag is 0 for AM, and 1 for PM.
        if ("p" in d) d.H = d.H % 12 + d.p * 12;

        // Convert day-of-week and week-of-year to day-of-year.
        if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "W" in d ? 1 : 0;
          var day = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
          d.m = 0;
          d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
        }

        // If a time zone is specified, all fields are interpreted as UTC and then
        // offset according to the specified time zone.
        if ("Z" in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }

        // Otherwise, all fields are in local time.
        return newDate(d);
      };
    }

    function parseSpecifier(d, specifier, string, j) {
      var i = 0,
          n = specifier.length,
          m = string.length,
          c,
          parse;

      while (i < n) {
        if (j >= m) return -1;
        c = specifier.charCodeAt(i++);
        if (c === 37) {
          c = specifier.charAt(i++);
          parse = parses[c in pads ? specifier.charAt(i++) : c];
          if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }

      return j;
    }

    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }

    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }

    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }

    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }

    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }

    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }

    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }

    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }

    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }

    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }

    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }

    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }

    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }

    return {
      format: function(specifier) {
        var f = newFormat(specifier += "", formats);
        f.parse = newParse(specifier, localDate);
        f.toString = function() { return specifier; };
        return f;
      },
      utcFormat: function(specifier) {
        var f = newFormat(specifier += "", utcFormats);
        f.parse = newParse(specifier, utcDate);
        f.toString = function() { return specifier; };
        return f;
      }
    };
  };

  var pads = {"-": "", "_": " ", "0": "0"};
  var numberRe = /^\s*\d+/;
  var percentRe = /^%/;
  var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  function pad(value, fill, width) {
    var sign = value < 0 ? "-" : "",
        string = (sign ? -value : value) + "",
        length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }

  function requote(s) {
    return s.replace(requoteRe, "\\$&");
  }

  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }

  function formatLookup(names) {
    var map = {}, i = -1, n = names.length;
    while (++i < n) map[names[i].toLowerCase()] = i;
    return map;
  }

  function parseWeekdayNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }

  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }

  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
  }

  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
  }

  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }

  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }

  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }

  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }

  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }

  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }

  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }

  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }

  function formatDayOfMonth(d, p) {
    return pad(d.getDate(), p, 2);
  }

  function formatHour24(d, p) {
    return pad(d.getHours(), p, 2);
  }

  function formatHour12(d, p) {
    return pad(d.getHours() % 12 || 12, p, 2);
  }

  function formatDayOfYear(d, p) {
    return pad(1 + d3Time.day.count(d3Time.year(d), d), p, 3);
  }

  function formatMilliseconds(d, p) {
    return pad(d.getMilliseconds(), p, 3);
  }

  function formatMonthNumber(d, p) {
    return pad(d.getMonth() + 1, p, 2);
  }

  function formatMinutes(d, p) {
    return pad(d.getMinutes(), p, 2);
  }

  function formatSeconds(d, p) {
    return pad(d.getSeconds(), p, 2);
  }

  function formatWeekNumberSunday(d, p) {
    return pad(d3Time.sunday.count(d3Time.year(d), d), p, 2);
  }

  function formatWeekdayNumber(d) {
    return d.getDay();
  }

  function formatWeekNumberMonday(d, p) {
    return pad(d3Time.monday.count(d3Time.year(d), d), p, 2);
  }

  function formatYear(d, p) {
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatFullYear(d, p) {
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? "-" : (z *= -1, "+"))
        + pad(z / 60 | 0, "0", 2)
        + pad(z % 60, "0", 2);
  }

  function formatUTCDayOfMonth(d, p) {
    return pad(d.getUTCDate(), p, 2);
  }

  function formatUTCHour24(d, p) {
    return pad(d.getUTCHours(), p, 2);
  }

  function formatUTCHour12(d, p) {
    return pad(d.getUTCHours() % 12 || 12, p, 2);
  }

  function formatUTCDayOfYear(d, p) {
    return pad(1 + d3Time.utcDay.count(d3Time.utcYear(d), d), p, 3);
  }

  function formatUTCMilliseconds(d, p) {
    return pad(d.getUTCMilliseconds(), p, 3);
  }

  function formatUTCMonthNumber(d, p) {
    return pad(d.getUTCMonth() + 1, p, 2);
  }

  function formatUTCMinutes(d, p) {
    return pad(d.getUTCMinutes(), p, 2);
  }

  function formatUTCSeconds(d, p) {
    return pad(d.getUTCSeconds(), p, 2);
  }

  function formatUTCWeekNumberSunday(d, p) {
    return pad(d3Time.utcSunday.count(d3Time.utcYear(d), d), p, 2);
  }

  function formatUTCWeekdayNumber(d) {
    return d.getUTCDay();
  }

  function formatUTCWeekNumberMonday(d, p) {
    return pad(d3Time.utcMonday.count(d3Time.utcYear(d), d), p, 2);
  }

  function formatUTCYear(d, p) {
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCFullYear(d, p) {
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCZone() {
    return "+0000";
  }

  function formatLiteralPercent() {
    return "%";
  }

  var locale = locale$1({
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });

  var caES = locale$1({
    dateTime: "%A, %e de %B de %Y, %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["diumenge", "dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte"],
    shortDays: ["dg.", "dl.", "dt.", "dc.", "dj.", "dv.", "ds."],
    months: ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"],
    shortMonths: ["gen.", "febr.", "març", "abr.", "maig", "juny", "jul.", "ag.", "set.", "oct.", "nov.", "des."]
  });

  var deCH = locale$1({
    dateTime: "%A, der %e. %B %Y, %X",
    date: "%d.%m.%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"], // unused
    days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    shortMonths: ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
  });

  var deDE = locale$1({
    dateTime: "%A, der %e. %B %Y, %X",
    date: "%d.%m.%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"], // unused
    days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    shortMonths: ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
  });

  var enCA = locale$1({
    dateTime: "%a %b %e %X %Y",
    date: "%Y-%m-%d",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });

  var enGB = locale$1({
    dateTime: "%a %e %b %X %Y",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });

  var esES = locale$1({
    dateTime: "%A, %e de %B de %Y, %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    shortDays: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    shortMonths: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  });

  var fiFI = locale$1({
    dateTime: "%A, %-d. %Bta %Y klo %X",
    date: "%-d.%-m.%Y",
    time: "%H:%M:%S",
    periods: ["a.m.", "p.m."],
    days: ["sunnuntai", "maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai"],
    shortDays: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"],
    months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
    shortMonths: ["Tammi", "Helmi", "Maalis", "Huhti", "Touko", "Kesä", "Heinä", "Elo", "Syys", "Loka", "Marras", "Joulu"]
  });

  var frCA = locale$1({
    dateTime: "%a %e %b %Y %X",
    date: "%Y-%m-%d",
    time: "%H:%M:%S",
    periods: ["", ""],
    days: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
    shortDays: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"],
    months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    shortMonths: ["jan", "fév", "mar", "avr", "mai", "jui", "jul", "aoû", "sep", "oct", "nov", "déc"]
  });

  var frFR = locale$1({
    dateTime: "%A, le %e %B %Y, %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"], // unused
    days: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
    shortDays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
    months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    shortMonths: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
  });

  var heIL = locale$1({
    dateTime: "%A, %e ב%B %Y %X",
    date: "%d.%m.%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    shortDays: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"],
    months: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
    shortMonths: ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"]
  });

  var huHU = locale$1({
    dateTime: "%Y. %B %-e., %A %X",
    date: "%Y. %m. %d.",
    time: "%H:%M:%S",
    periods: ["de.", "du."], // unused
    days: ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"],
    shortDays: ["V", "H", "K", "Sze", "Cs", "P", "Szo"],
    months: ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"],
    shortMonths: ["jan.", "feb.", "már.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."]
  });

  var itIT = locale$1({
    dateTime: "%A %e %B %Y, %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"], // unused
    days: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
    shortDays: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
    months: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
    shortMonths: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
  });

  var jaJP = locale$1({
    dateTime: "%Y %b %e %a %X",
    date: "%Y/%m/%d",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
    shortDays: ["日", "月", "火", "水", "木", "金", "土"],
    months: ["睦月", "如月", "弥生", "卯月", "皐月", "水無月", "文月", "葉月", "長月", "神無月", "霜月", "師走"],
    shortMonths: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  });

  var koKR = locale$1({
    dateTime: "%Y/%m/%d %a %X",
    date: "%Y/%m/%d",
    time: "%H:%M:%S",
    periods: ["오전", "오후"],
    days: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
    shortDays: ["일", "월", "화", "수", "목", "금", "토"],
    months: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    shortMonths: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
  });

  var mkMK = locale$1({
    dateTime: "%A, %e %B %Y г. %X",
    date: "%d.%m.%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["недела", "понеделник", "вторник", "среда", "четврток", "петок", "сабота"],
    shortDays: ["нед", "пон", "вто", "сре", "чет", "пет", "саб"],
    months: ["јануари", "февруари", "март", "април", "мај", "јуни", "јули", "август", "септември", "октомври", "ноември", "декември"],
    shortMonths: ["јан", "фев", "мар", "апр", "мај", "јун", "јул", "авг", "сеп", "окт", "ное", "дек"]
  });

  var nlNL = locale$1({
    dateTime: "%a %e %B %Y %T",
    date: "%d-%m-%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"], // unused
    days: ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
    shortDays: ["zo", "ma", "di", "wo", "do", "vr", "za"],
    months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
    shortMonths: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
  });

  var plPL = locale$1({
    dateTime: "%A, %e %B %Y, %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"], // unused
    days: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
    shortDays: ["Niedz.", "Pon.", "Wt.", "Śr.", "Czw.", "Pt.", "Sob."],
    months: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
    shortMonths: ["Stycz.", "Luty", "Marz.", "Kwie.", "Maj", "Czerw.", "Lipc.", "Sierp.", "Wrz.", "Paźdz.", "Listop.", "Grudz."]/* In Polish language abbraviated months are not commonly used so there is a dispute about the proper abbraviations. */
  });

  var ptBR = locale$1({
    dateTime: "%A, %e de %B de %Y. %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
    shortDays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    shortMonths: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  });

  var ruRU = locale$1({
    dateTime: "%A, %e %B %Y г. %X",
    date: "%d.%m.%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
    shortDays: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
    months: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
    shortMonths: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
  });

  var svSE = locale$1({
    dateTime: "%A den %d %B %Y %X",
    date: "%Y-%m-%d",
    time: "%H:%M:%S",
    periods: ["fm", "em"],
    days: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"],
    shortDays: ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"],
    months: ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
  });

  var zhCN = locale$1({
    dateTime: "%a %b %e %X %Y",
    date: "%Y/%-m/%-d",
    time: "%H:%M:%S",
    periods: ["上午", "下午"],
    days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    shortDays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    shortMonths: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
  });

  var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

  function formatIsoNative(date) {
    return date.toISOString();
  }

  formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };

  formatIsoNative.toString = function() {
    return isoSpecifier;
  };

  var formatIso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z")
      ? formatIsoNative
      : locale.utcFormat(isoSpecifier);

  var format = locale.format;
  var utcFormat = locale.utcFormat;

  var version = "0.2.1";

  exports.version = version;
  exports.format = format;
  exports.utcFormat = utcFormat;
  exports.locale = locale$1;
  exports.localeCaEs = caES;
  exports.localeDeCh = deCH;
  exports.localeDeDe = deDE;
  exports.localeEnCa = enCA;
  exports.localeEnGb = enGB;
  exports.localeEnUs = locale;
  exports.localeEsEs = esES;
  exports.localeFiFi = fiFI;
  exports.localeFrCa = frCA;
  exports.localeFrFr = frFR;
  exports.localeHeIl = heIL;
  exports.localeHuHu = huHU;
  exports.localeItIt = itIT;
  exports.localeJaJp = jaJP;
  exports.localeKoKr = koKR;
  exports.localeMkMk = mkMK;
  exports.localeNlNl = nlNL;
  exports.localePlPl = plPL;
  exports.localePtBr = ptBR;
  exports.localeRuRu = ruRU;
  exports.localeSvSe = svSE;
  exports.localeZhCn = zhCN;
  exports.isoFormat = formatIso;

}));
},{"d3-time":5}],5:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('d3-time', ['exports'], factory) :
  factory((global.d3_time = {}));
}(this, function (exports) { 'use strict';

  var t0 = new Date;
  var t1 = new Date;
  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = new Date(+date)), date;
    }

    interval.floor = interval;

    interval.round = function(date) {
      var d0 = new Date(+date),
          d1 = new Date(date - 1);
      floori(d0), floori(d1), offseti(d1, 1);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.ceil = function(date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), date;
    };

    interval.offset = function(date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function(start, stop, step) {
      var range = [];
      start = new Date(start - 1);
      stop = new Date(+stop);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      offseti(start, 1), floori(start);
      if (start < stop) range.push(new Date(+start));
      while (offseti(start, step), floori(start), start < stop) range.push(new Date(+start));
      return range;
    };

    interval.filter = function(test) {
      return newInterval(function(date) {
        while (floori(date), !test(date)) date.setTime(date - 1);
      }, function(date, step) {
        while (--step >= 0) while (offseti(date, 1), !test(date));
      });
    };

    if (count) {
      interval.count = function(start, end) {
        t0.setTime(+start), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };

      interval.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
            : !(step > 1) ? interval
            : interval.filter(field
                ? function(d) { return field(d) % step === 0; }
                : function(d) { return interval.count(0, d) % step === 0; });
      };
    }

    return interval;
  };

  var millisecond = newInterval(function() {
    // noop
  }, function(date, step) {
    date.setTime(+date + step);
  }, function(start, end) {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = function(k) {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) return null;
    if (!(k > 1)) return millisecond;
    return newInterval(function(date) {
      date.setTime(Math.floor(date / k) * k);
    }, function(date, step) {
      date.setTime(+date + step * k);
    }, function(start, end) {
      return (end - start) / k;
    });
  };

  var second = newInterval(function(date) {
    date.setMilliseconds(0);
  }, function(date, step) {
    date.setTime(+date + step * 1e3);
  }, function(start, end) {
    return (end - start) / 1e3;
  }, function(date) {
    return date.getSeconds();
  });

  var minute = newInterval(function(date) {
    date.setSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 6e4);
  }, function(start, end) {
    return (end - start) / 6e4;
  }, function(date) {
    return date.getMinutes();
  });

  var hour = newInterval(function(date) {
    date.setMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 36e5);
  }, function(start, end) {
    return (end - start) / 36e5;
  }, function(date) {
    return date.getHours();
  });

  var day = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 6e4) / 864e5;
  }, function(date) {
    return date.getDate() - 1;
  });

  function weekday(i) {
    return newInterval(function(date) {
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    }, function(date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 6e4) / 6048e5;
    });
  }

  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);

  var month = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
    date.setDate(1);
  }, function(date, step) {
    date.setMonth(date.getMonth() + step);
  }, function(start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, function(date) {
    return date.getMonth();
  });

  var year = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
    date.setMonth(0, 1);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function(start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function(date) {
    return date.getFullYear();
  });

  var utcSecond = newInterval(function(date) {
    date.setUTCMilliseconds(0);
  }, function(date, step) {
    date.setTime(+date + step * 1e3);
  }, function(start, end) {
    return (end - start) / 1e3;
  }, function(date) {
    return date.getUTCSeconds();
  });

  var utcMinute = newInterval(function(date) {
    date.setUTCSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 6e4);
  }, function(start, end) {
    return (end - start) / 6e4;
  }, function(date) {
    return date.getUTCMinutes();
  });

  var utcHour = newInterval(function(date) {
    date.setUTCMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * 36e5);
  }, function(start, end) {
    return (end - start) / 36e5;
  }, function(date) {
    return date.getUTCHours();
  });

  var utcDay = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function(start, end) {
    return (end - start) / 864e5;
  }, function(date) {
    return date.getUTCDate() - 1;
  });

  function utcWeekday(i) {
    return newInterval(function(date) {
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function(start, end) {
      return (end - start) / 6048e5;
    });
  }

  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);

  var utcMonth = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(1);
  }, function(date, step) {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, function(start, end) {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  }, function(date) {
    return date.getUTCMonth();
  });

  var utcYear = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCMonth(0, 1);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function(start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function(date) {
    return date.getUTCFullYear();
  });

  var milliseconds = millisecond.range;
  var seconds = second.range;
  var minutes = minute.range;
  var hours = hour.range;
  var days = day.range;
  var sundays = sunday.range;
  var mondays = monday.range;
  var tuesdays = tuesday.range;
  var wednesdays = wednesday.range;
  var thursdays = thursday.range;
  var fridays = friday.range;
  var saturdays = saturday.range;
  var weeks = sunday.range;
  var months = month.range;
  var years = year.range;

  var utcMillisecond = millisecond;
  var utcMilliseconds = milliseconds;
  var utcSeconds = utcSecond.range;
  var utcMinutes = utcMinute.range;
  var utcHours = utcHour.range;
  var utcDays = utcDay.range;
  var utcSundays = utcSunday.range;
  var utcMondays = utcMonday.range;
  var utcTuesdays = utcTuesday.range;
  var utcWednesdays = utcWednesday.range;
  var utcThursdays = utcThursday.range;
  var utcFridays = utcFriday.range;
  var utcSaturdays = utcSaturday.range;
  var utcWeeks = utcSunday.range;
  var utcMonths = utcMonth.range;
  var utcYears = utcYear.range;

  var version = "0.1.1";

  exports.version = version;
  exports.milliseconds = milliseconds;
  exports.seconds = seconds;
  exports.minutes = minutes;
  exports.hours = hours;
  exports.days = days;
  exports.sundays = sundays;
  exports.mondays = mondays;
  exports.tuesdays = tuesdays;
  exports.wednesdays = wednesdays;
  exports.thursdays = thursdays;
  exports.fridays = fridays;
  exports.saturdays = saturdays;
  exports.weeks = weeks;
  exports.months = months;
  exports.years = years;
  exports.utcMillisecond = utcMillisecond;
  exports.utcMilliseconds = utcMilliseconds;
  exports.utcSeconds = utcSeconds;
  exports.utcMinutes = utcMinutes;
  exports.utcHours = utcHours;
  exports.utcDays = utcDays;
  exports.utcSundays = utcSundays;
  exports.utcMondays = utcMondays;
  exports.utcTuesdays = utcTuesdays;
  exports.utcWednesdays = utcWednesdays;
  exports.utcThursdays = utcThursdays;
  exports.utcFridays = utcFridays;
  exports.utcSaturdays = utcSaturdays;
  exports.utcWeeks = utcWeeks;
  exports.utcMonths = utcMonths;
  exports.utcYears = utcYears;
  exports.millisecond = millisecond;
  exports.second = second;
  exports.minute = minute;
  exports.hour = hour;
  exports.day = day;
  exports.sunday = sunday;
  exports.monday = monday;
  exports.tuesday = tuesday;
  exports.wednesday = wednesday;
  exports.thursday = thursday;
  exports.friday = friday;
  exports.saturday = saturday;
  exports.week = sunday;
  exports.month = month;
  exports.year = year;
  exports.utcSecond = utcSecond;
  exports.utcMinute = utcMinute;
  exports.utcHour = utcHour;
  exports.utcDay = utcDay;
  exports.utcSunday = utcSunday;
  exports.utcMonday = utcMonday;
  exports.utcTuesday = utcTuesday;
  exports.utcWednesday = utcWednesday;
  exports.utcThursday = utcThursday;
  exports.utcFriday = utcFriday;
  exports.utcSaturday = utcSaturday;
  exports.utcWeek = utcSunday;
  exports.utcMonth = utcMonth;
  exports.utcYear = utcYear;
  exports.interval = newInterval;

}));
},{}],6:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.topojson = {})));
}(this, function (exports) { 'use strict';

  function noop() {}

  function absolute(transform) {
    if (!transform) return noop;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(point, i) {
      if (!i) x0 = y0 = 0;
      point[0] = (x0 += point[0]) * kx + dx;
      point[1] = (y0 += point[1]) * ky + dy;
    };
  }

  function relative(transform) {
    if (!transform) return noop;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(point, i) {
      if (!i) x0 = y0 = 0;
      var x1 = (point[0] - dx) / kx | 0,
          y1 = (point[1] - dy) / ky | 0;
      point[0] = x1 - x0;
      point[1] = y1 - y0;
      x0 = x1;
      y0 = y1;
    };
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n;
    while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

  function bisect(a, x) {
    var lo = 0, hi = a.length;
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (a[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function feature(topology, o) {
    return o.type === "GeometryCollection" ? {
      type: "FeatureCollection",
      features: o.geometries.map(function(o) { return feature$1(topology, o); })
    } : feature$1(topology, o);
  }

  function feature$1(topology, o) {
    var f = {
      type: "Feature",
      id: o.id,
      properties: o.properties || {},
      geometry: object(topology, o)
    };
    if (o.id == null) delete f.id;
    return f;
  }

  function object(topology, o) {
    var absolute$$ = absolute(topology.transform),
        arcs = topology.arcs;

    function arc(i, points) {
      if (points.length) points.pop();
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {
        points.push(p = a[k].slice());
        absolute$$(p, k);
      }
      if (i < 0) reverse(points, n);
    }

    function point(p) {
      p = p.slice();
      absolute$$(p, 0);
      return p;
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      if (points.length < 2) points.push(points[0].slice());
      return points;
    }

    function ring(arcs) {
      var points = line(arcs);
      while (points.length < 4) points.push(points[0].slice());
      return points;
    }

    function polygon(arcs) {
      return arcs.map(ring);
    }

    function geometry(o) {
      var t = o.type;
      return t === "GeometryCollection" ? {type: t, geometries: o.geometries.map(geometry)}
          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}
          : null;
    }

    var geometryType = {
      Point: function(o) { return point(o.coordinates); },
      MultiPoint: function(o) { return o.coordinates.map(point); },
      LineString: function(o) { return line(o.arcs); },
      MultiLineString: function(o) { return o.arcs.map(line); },
      Polygon: function(o) { return polygon(o.arcs); },
      MultiPolygon: function(o) { return o.arcs.map(polygon); }
    };

    return geometry(o);
  }

  function stitchArcs(topology, arcs) {
    var stitchedArcs = {},
        fragmentByStart = {},
        fragmentByEnd = {},
        fragments = [],
        emptyIndex = -1;

    // Stitch empty arcs first, since they may be subsumed by other arcs.
    arcs.forEach(function(i, j) {
      var arc = topology.arcs[i < 0 ? ~i : i], t;
      if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
        t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
      }
    });

    arcs.forEach(function(i) {
      var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

      if (f = fragmentByEnd[start]) {
        delete fragmentByEnd[f.end];
        f.push(i);
        f.end = end;
        if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[end]) {
        delete fragmentByStart[f.start];
        f.unshift(i);
        f.start = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else {
        f = [i];
        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
      }
    });

    function ends(i) {
      var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
      if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
      else p1 = arc[arc.length - 1];
      return i < 0 ? [p1, p0] : [p0, p1];
    }

    function flush(fragmentByEnd, fragmentByStart) {
      for (var k in fragmentByEnd) {
        var f = fragmentByEnd[k];
        delete fragmentByStart[f.start];
        delete f.start;
        delete f.end;
        f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
        fragments.push(f);
      }
    }

    flush(fragmentByEnd, fragmentByStart);
    flush(fragmentByStart, fragmentByEnd);
    arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

    return fragments;
  }

  function mesh(topology) {
    return object(topology, meshArcs.apply(this, arguments));
  }

  function meshArcs(topology, o, filter) {
    var arcs = [];

    function arc(i) {
      var j = i < 0 ? ~i : i;
      (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
    }

    function line(arcs) {
      arcs.forEach(arc);
    }

    function polygon(arcs) {
      arcs.forEach(line);
    }

    function geometry(o) {
      if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
      else if (o.type in geometryType) geom = o, geometryType[o.type](o.arcs);
    }

    if (arguments.length > 1) {
      var geomsByArc = [],
          geom;

      var geometryType = {
        LineString: line,
        MultiLineString: polygon,
        Polygon: polygon,
        MultiPolygon: function(arcs) { arcs.forEach(polygon); }
      };

      geometry(o);

      geomsByArc.forEach(arguments.length < 3
          ? function(geoms) { arcs.push(geoms[0].i); }
          : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });
    } else {
      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);
    }

    return {type: "MultiLineString", arcs: stitchArcs(topology, arcs)};
  }

  function triangle(triangle) {
    var a = triangle[0], b = triangle[1], c = triangle[2];
    return Math.abs((a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]));
  }

  function ring(ring) {
    var i = -1,
        n = ring.length,
        a,
        b = ring[n - 1],
        area = 0;

    while (++i < n) {
      a = b;
      b = ring[i];
      area += a[0] * b[1] - a[1] * b[0];
    }

    return area / 2;
  }

  function merge(topology) {
    return object(topology, mergeArcs.apply(this, arguments));
  }

  function mergeArcs(topology, objects) {
    var polygonsByArc = {},
        polygons = [],
        components = [];

    objects.forEach(function(o) {
      if (o.type === "Polygon") register(o.arcs);
      else if (o.type === "MultiPolygon") o.arcs.forEach(register);
    });

    function register(polygon) {
      polygon.forEach(function(ring$$) {
        ring$$.forEach(function(arc) {
          (polygonsByArc[arc = arc < 0 ? ~arc : arc] || (polygonsByArc[arc] = [])).push(polygon);
        });
      });
      polygons.push(polygon);
    }

    function exterior(ring$$) {
      return ring(object(topology, {type: "Polygon", arcs: [ring$$]}).coordinates[0]) > 0; // TODO allow spherical?
    }

    polygons.forEach(function(polygon) {
      if (!polygon._) {
        var component = [],
            neighbors = [polygon];
        polygon._ = 1;
        components.push(component);
        while (polygon = neighbors.pop()) {
          component.push(polygon);
          polygon.forEach(function(ring$$) {
            ring$$.forEach(function(arc) {
              polygonsByArc[arc < 0 ? ~arc : arc].forEach(function(polygon) {
                if (!polygon._) {
                  polygon._ = 1;
                  neighbors.push(polygon);
                }
              });
            });
          });
        }
      }
    });

    polygons.forEach(function(polygon) {
      delete polygon._;
    });

    return {
      type: "MultiPolygon",
      arcs: components.map(function(polygons) {
        var arcs = [], n;

        // Extract the exterior (unique) arcs.
        polygons.forEach(function(polygon) {
          polygon.forEach(function(ring$$) {
            ring$$.forEach(function(arc) {
              if (polygonsByArc[arc < 0 ? ~arc : arc].length < 2) {
                arcs.push(arc);
              }
            });
          });
        });

        // Stitch the arcs into one or more rings.
        arcs = stitchArcs(topology, arcs);

        // If more than one ring is returned,
        // at most one of these rings can be the exterior;
        // this exterior ring has the same winding order
        // as any exterior ring in the original polygons.
        if ((n = arcs.length) > 1) {
          var sgn = exterior(polygons[0][0]);
          for (var i = 0, t; i < n; ++i) {
            if (sgn === exterior(arcs[i])) {
              t = arcs[0], arcs[0] = arcs[i], arcs[i] = t;
              break;
            }
          }
        }

        return arcs;
      })
    };
  }

  function neighbors(objects) {
    var indexesByArc = {}, // arc index -> array of object indexes
        neighbors = objects.map(function() { return []; });

    function line(arcs, i) {
      arcs.forEach(function(a) {
        if (a < 0) a = ~a;
        var o = indexesByArc[a];
        if (o) o.push(i);
        else indexesByArc[a] = [i];
      });
    }

    function polygon(arcs, i) {
      arcs.forEach(function(arc) { line(arc, i); });
    }

    function geometry(o, i) {
      if (o.type === "GeometryCollection") o.geometries.forEach(function(o) { geometry(o, i); });
      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);
    }

    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }
    };

    objects.forEach(geometry);

    for (var i in indexesByArc) {
      for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {
        for (var k = j + 1; k < m; ++k) {
          var ij = indexes[j], ik = indexes[k], n;
          if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);
          if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);
        }
      }
    }

    return neighbors;
  }

  function compareArea(a, b) {
    return a[1][2] - b[1][2];
  }

  function minAreaHeap() {
    var heap = {},
        array = [],
        size = 0;

    heap.push = function(object) {
      up(array[object._ = size] = object, size++);
      return size;
    };

    heap.pop = function() {
      if (size <= 0) return;
      var removed = array[0], object;
      if (--size > 0) object = array[size], down(array[object._ = 0] = object, 0);
      return removed;
    };

    heap.remove = function(removed) {
      var i = removed._, object;
      if (array[i] !== removed) return; // invalid request
      if (i !== --size) object = array[size], (compareArea(object, removed) < 0 ? up : down)(array[object._ = i] = object, i);
      return i;
    };

    function up(object, i) {
      while (i > 0) {
        var j = ((i + 1) >> 1) - 1,
            parent = array[j];
        if (compareArea(object, parent) >= 0) break;
        array[parent._ = i] = parent;
        array[object._ = i = j] = object;
      }
    }

    function down(object, i) {
      while (true) {
        var r = (i + 1) << 1,
            l = r - 1,
            j = i,
            child = array[j];
        if (l < size && compareArea(array[l], child) < 0) child = array[j = l];
        if (r < size && compareArea(array[r], child) < 0) child = array[j = r];
        if (j === i) break;
        array[child._ = i] = child;
        array[object._ = i = j] = object;
      }
    }

    return heap;
  }

  function presimplify(topology, triangleArea) {
    var absolute$$ = absolute(topology.transform),
        relative$$ = relative(topology.transform),
        heap = minAreaHeap();

    if (!triangleArea) triangleArea = triangle;

    topology.arcs.forEach(function(arc) {
      var triangles = [],
          maxArea = 0,
          triangle,
          i,
          n,
          p;

      // To store each point’s effective area, we create a new array rather than
      // extending the passed-in point to workaround a Chrome/V8 bug (getting
      // stuck in smi mode). For midpoints, the initial effective area of
      // Infinity will be computed in the next step.
      for (i = 0, n = arc.length; i < n; ++i) {
        p = arc[i];
        absolute$$(arc[i] = [p[0], p[1], Infinity], i);
      }

      for (i = 1, n = arc.length - 1; i < n; ++i) {
        triangle = arc.slice(i - 1, i + 2);
        triangle[1][2] = triangleArea(triangle);
        triangles.push(triangle);
        heap.push(triangle);
      }

      for (i = 0, n = triangles.length; i < n; ++i) {
        triangle = triangles[i];
        triangle.previous = triangles[i - 1];
        triangle.next = triangles[i + 1];
      }

      while (triangle = heap.pop()) {
        var previous = triangle.previous,
            next = triangle.next;

        // If the area of the current point is less than that of the previous point
        // to be eliminated, use the latter's area instead. This ensures that the
        // current point cannot be eliminated without eliminating previously-
        // eliminated points.
        if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;
        else maxArea = triangle[1][2];

        if (previous) {
          previous.next = next;
          previous[2] = triangle[2];
          update(previous);
        }

        if (next) {
          next.previous = previous;
          next[0] = triangle[0];
          update(next);
        }
      }

      arc.forEach(relative$$);
    });

    function update(triangle) {
      heap.remove(triangle);
      triangle[1][2] = triangleArea(triangle);
      heap.push(triangle);
    }

    return topology;
  }

  var version = "1.6.24";

  exports.version = version;
  exports.mesh = mesh;
  exports.meshArcs = meshArcs;
  exports.merge = merge;
  exports.mergeArcs = mergeArcs;
  exports.feature = feature;
  exports.neighbors = neighbors;
  exports.presimplify = presimplify;

}));
},{}],7:[function(require,module,exports){
var util = require('./util'),
    time = require('./time'),
    utc = time.utc;

var u = module.exports;

u.$year   = util.$func('year', time.year.unit);
u.$month  = util.$func('month', time.months.unit);
u.$date   = util.$func('date', time.dates.unit);
u.$day    = util.$func('day', time.weekdays.unit);
u.$hour   = util.$func('hour', time.hours.unit);
u.$minute = util.$func('minute', time.minutes.unit);
u.$second = util.$func('second', time.seconds.unit);

u.$utcYear   = util.$func('utcYear', utc.year.unit);
u.$utcMonth  = util.$func('utcMonth', utc.months.unit);
u.$utcDate   = util.$func('utcDate', utc.dates.unit);
u.$utcDay    = util.$func('utcDay', utc.weekdays.unit);
u.$utcHour   = util.$func('utcHour', utc.hours.unit);
u.$utcMinute = util.$func('utcMinute', utc.minutes.unit);
u.$utcSecond = util.$func('utcSecond', utc.seconds.unit);

},{"./time":29,"./util":30}],8:[function(require,module,exports){
var util = require('../util'),
    Measures = require('./measures'),
    Collector = require('./collector');

function Aggregator() {
  this._cells = {};
  this._aggr = [];
  this._stream = false;
}

var Flags = Aggregator.Flags = {
  ADD_CELL: 1,
  MOD_CELL: 2
};

var proto = Aggregator.prototype;

// Parameters

proto.stream = function(v) {
  if (v == null) return this._stream;
  this._stream = !!v;
  this._aggr = [];
  return this;
};

// key accessor to use for streaming removes
proto.key = function(key) {
  if (key == null) return this._key;
  this._key = util.$(key);
  return this;
};

// Input: array of objects of the form
// {name: string, get: function}
proto.groupby = function(dims) {
  this._dims = util.array(dims).map(function(d, i) {
    d = util.isString(d) ? {name: d, get: util.$(d)}
      : util.isFunction(d) ? {name: util.name(d) || d.name || ('_' + i), get: d}
      : (d.name && util.isFunction(d.get)) ? d : null;
    if (d == null) throw 'Invalid groupby argument: ' + d;
    return d;
  });
  return this.clear();
};

// Input: array of objects of the form
// {name: string, ops: [string, ...]}
proto.summarize = function(fields) {
  fields = summarize_args(fields);
  this._count = true;
  var aggr = (this._aggr = []),
      m, f, i, j, op, as, get;

  for (i=0; i<fields.length; ++i) {
    for (j=0, m=[], f=fields[i]; j<f.ops.length; ++j) {
      op = f.ops[j];
      if (op !== 'count') this._count = false;
      as = (f.as && f.as[j]) || (op + (f.name==='*' ? '' : '_'+f.name));
      m.push(Measures[op](as));
    }
    get = f.get && util.$(f.get) ||
      (f.name === '*' ? util.identity : util.$(f.name));
    aggr.push({
      name: f.name,
      measures: Measures.create(
        m,
        this._stream, // streaming remove flag
        get,          // input tuple getter
        this._assign) // output tuple setter
    });
  }
  return this.clear();
};

// Convenience method to summarize by count
proto.count = function() {
  return this.summarize({'*':'count'});
};

// Override to perform custom tuple value assignment
proto._assign = function(object, name, value) {
  object[name] = value;
};

function summarize_args(fields) {
  if (util.isArray(fields)) { return fields; }
  if (fields == null) { return []; }
  var a = [], name, ops;
  for (name in fields) {
    ops = util.array(fields[name]);
    a.push({name: name, ops: ops});
  }
  return a;
}

// Cell Management

proto.clear = function() {
  return (this._cells = {}, this);
};

proto._cellkey = function(x) {
  var d = this._dims,
      n = d.length, i,
      k = String(d[0].get(x));
  for (i=1; i<n; ++i) {
    k += '|' + d[i].get(x);
  }
  return k;
};

proto._cell = function(x) {
  var key = this._dims.length ? this._cellkey(x) : '';
  return this._cells[key] || (this._cells[key] = this._newcell(x, key));
};

proto._newcell = function(x, key) {
  var cell = {
    num:   0,
    tuple: this._newtuple(x, key),
    flag:  Flags.ADD_CELL,
    aggs:  {}
  };

  var aggr = this._aggr, i;
  for (i=0; i<aggr.length; ++i) {
    cell.aggs[aggr[i].name] = new aggr[i].measures(cell, cell.tuple);
  }
  if (cell.collect) {
    cell.data = new Collector(this._key);
  }
  return cell;
};

proto._newtuple = function(x) {
  var dims = this._dims,
      t = {}, i, n;
  for (i=0, n=dims.length; i<n; ++i) {
    t[dims[i].name] = dims[i].get(x);
  }
  return this._ingest(t);
};

// Override to perform custom tuple ingestion
proto._ingest = util.identity;

// Process Tuples

proto._add = function(x) {
  var cell = this._cell(x),
      aggr = this._aggr, i;

  cell.num += 1;
  if (!this._count) { // skip if count-only
    if (cell.collect) cell.data.add(x);
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].add(x);
    }
  }
  cell.flag |= Flags.MOD_CELL;
  if (this._on_add) this._on_add(x, cell);
};

proto._rem = function(x) {
  var cell = this._cell(x),
      aggr = this._aggr, i;

  cell.num -= 1;
  if (!this._count) { // skip if count-only
    if (cell.collect) cell.data.rem(x);
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].rem(x);
    }
  }
  cell.flag |= Flags.MOD_CELL;
  if (this._on_rem) this._on_rem(x, cell);
};

proto._mod = function(curr, prev) {
  var cell0 = this._cell(prev),
      cell1 = this._cell(curr),
      aggr = this._aggr, i;

  if (cell0 !== cell1) {
    cell0.num -= 1;
    cell1.num += 1;
    if (cell0.collect) cell0.data.rem(prev);
    if (cell1.collect) cell1.data.add(curr);
  } else if (cell0.collect && !util.isObject(curr)) {
    cell0.data.rem(prev);
    cell0.data.add(curr);
  }

  for (i=0; i<aggr.length; ++i) {
    cell0.aggs[aggr[i].name].rem(prev);
    cell1.aggs[aggr[i].name].add(curr);
  }
  cell0.flag |= Flags.MOD_CELL;
  cell1.flag |= Flags.MOD_CELL;
  if (this._on_mod) this._on_mod(curr, prev, cell0, cell1);
};

proto._markMod = function(x) {
  var cell0 = this._cell(x);
  cell0.flag |= Flags.MOD_CELL;
};

proto.result = function() {
  var result = [],
      aggr = this._aggr,
      cell, i, k;

  for (k in this._cells) {
    cell = this._cells[k];
    if (cell.num > 0) {
      // consolidate collector values
      if (cell.collect) {
        cell.data.values();
      }
      // update tuple properties
      for (i=0; i<aggr.length; ++i) {
        cell.aggs[aggr[i].name].set();
      }
      // add output tuple
      result.push(cell.tuple);
    } else {
      delete this._cells[k];
    }
    cell.flag = 0;
  }

  this._rems = false;
  return result;
};

proto.changes = function(output) {
  var changes = output || {add:[], rem:[], mod:[]},
      aggr = this._aggr,
      cell, flag, i, k;

  for (k in this._cells) {
    cell = this._cells[k];
    flag = cell.flag;

    // consolidate collector values
    if (cell.collect) {
      cell.data.values();
    }

    // update tuple properties
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].set();
    }

    // organize output tuples
    if (cell.num <= 0) {
      changes.rem.push(cell.tuple); // if (flag === Flags.MOD_CELL) { ??
      delete this._cells[k];
      if (this._on_drop) this._on_drop(cell);
    } else {
      if (this._on_keep) this._on_keep(cell);
      if (flag & Flags.ADD_CELL) {
        changes.add.push(cell.tuple);
      } else if (flag & Flags.MOD_CELL) {
        changes.mod.push(cell.tuple);
      }
    }

    cell.flag = 0;
  }

  this._rems = false;
  return changes;
};

proto.execute = function(input) {
  return this.clear().insert(input).result();
};

proto.insert = function(input) {
  this._consolidate();
  for (var i=0; i<input.length; ++i) {
    this._add(input[i]);
  }
  return this;
};

proto.remove = function(input) {
  if (!this._stream) {
    throw 'Aggregator not configured for streaming removes.' +
      ' Call stream(true) prior to calling summarize.';
  }
  for (var i=0; i<input.length; ++i) {
    this._rem(input[i]);
  }
  this._rems = true;
  return this;
};

// consolidate removals
proto._consolidate = function() {
  if (!this._rems) return;
  for (var k in this._cells) {
    if (this._cells[k].collect) {
      this._cells[k].data.values();
    }
  }
  this._rems = false;
};

module.exports = Aggregator;

},{"../util":30,"./collector":9,"./measures":11}],9:[function(require,module,exports){
var util = require('../util');
var stats = require('../stats');

var REM = '__dl_rem__';

function Collector(key) {
  this._add = [];
  this._rem = [];
  this._key = key || null;
  this._last = null;
}

var proto = Collector.prototype;

proto.add = function(v) {
  this._add.push(v);
};

proto.rem = function(v) {
  this._rem.push(v);
};

proto.values = function() {
  this._get = null;
  if (this._rem.length === 0) return this._add;

  var a = this._add,
      r = this._rem,
      k = this._key,
      x = Array(a.length - r.length),
      i, j, n, m;

  if (!util.isObject(r[0])) {
    // processing raw values
    m = stats.count.map(r);
    for (i=0, j=0, n=a.length; i<n; ++i) {
      if (m[a[i]] > 0) {
        m[a[i]] -= 1;
      } else {
        x[j++] = a[i];
      }
    }
  } else if (k) {
    // has unique key field, so use that
    m = util.toMap(r, k);
    for (i=0, j=0, n=a.length; i<n; ++i) {
      if (!m.hasOwnProperty(k(a[i]))) { x[j++] = a[i]; }
    }
  } else {
    // no unique key, mark tuples directly
    for (i=0, n=r.length; i<n; ++i) {
      r[i][REM] = 1;
    }
    for (i=0, j=0, n=a.length; i<n; ++i) {
      if (!a[i][REM]) { x[j++] = a[i]; }
    }
    for (i=0, n=r.length; i<n; ++i) {
      delete r[i][REM];
    }
  }

  this._rem = [];
  return (this._add = x);
};

// memoizing statistics methods

proto.extent = function(get) {
  if (this._get !== get || !this._ext) {
    var v = this.values(),
        i = stats.extent.index(v, get);
    this._ext = [v[i[0]], v[i[1]]];
    this._get = get;
  }
  return this._ext;
};

proto.argmin = function(get) {
  return this.extent(get)[0];
};

proto.argmax = function(get) {
  return this.extent(get)[1];
};

proto.min = function(get) {
  var m = this.extent(get)[0];
  return m != null ? get(m) : +Infinity;
};

proto.max = function(get) {
  var m = this.extent(get)[1];
  return m != null ? get(m) : -Infinity;
};

proto.quartile = function(get) {
  if (this._get !== get || !this._q) {
    this._q = stats.quartile(this.values(), get);
    this._get = get;
  }
  return this._q;
};

proto.q1 = function(get) {
  return this.quartile(get)[0];
};

proto.q2 = function(get) {
  return this.quartile(get)[1];
};

proto.q3 = function(get) {
  return this.quartile(get)[2];
};

module.exports = Collector;

},{"../stats":27,"../util":30}],10:[function(require,module,exports){
var util = require('../util');
var Aggregator = require('./aggregator');

module.exports = function() {
  // flatten arguments into a single array
  var args = [].reduce.call(arguments, function(a, x) {
    return a.concat(util.array(x));
  }, []);
  // create and return an aggregator
  return new Aggregator()
    .groupby(args)
    .summarize({'*':'values'});
};

},{"../util":30,"./aggregator":8}],11:[function(require,module,exports){
var util = require('../util');

var types = {
  'values': measure({
    name: 'values',
    init: 'cell.collect = true;',
    set:  'cell.data.values()', idx: -1
  }),
  'count': measure({
    name: 'count',
    set:  'cell.num'
  }),
  'missing': measure({
    name: 'missing',
    set:  'this.missing'
  }),
  'valid': measure({
    name: 'valid',
    set:  'this.valid'
  }),
  'sum': measure({
    name: 'sum',
    init: 'this.sum = 0;',
    add:  'this.sum += v;',
    rem:  'this.sum -= v;',
    set:  'this.sum'
  }),
  'mean': measure({
    name: 'mean',
    init: 'this.mean = 0;',
    add:  'var d = v - this.mean; this.mean += d / this.valid;',
    rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
    set:  'this.mean'
  }),
  'average': measure({
    name: 'average',
    set:  'this.mean',
    req:  ['mean'], idx: 1
  }),
  'variance': measure({
    name: 'variance',
    init: 'this.dev = 0;',
    add:  'this.dev += d * (v - this.mean);',
    rem:  'this.dev -= d * (v - this.mean);',
    set:  'this.valid > 1 ? this.dev / (this.valid-1) : 0',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure({
    name: 'variancep',
    set:  'this.valid > 1 ? this.dev / this.valid : 0',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure({
    name: 'stdev',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : 0',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure({
    name: 'stdevp',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : 0',
    req:  ['variance'], idx: 2
  }),
  'median': measure({
    name: 'median',
    set:  'cell.data.q2(this.get)',
    req:  ['values'], idx: 3
  }),
  'q1': measure({
    name: 'q1',
    set:  'cell.data.q1(this.get)',
    req:  ['values'], idx: 3
  }),
  'q3': measure({
    name: 'q3',
    set:  'cell.data.q3(this.get)',
    req:  ['values'], idx: 3
  }),
  'distinct': measure({
    name: 'distinct',
    set:  'this.distinct(cell.data.values(), this.get)',
    req:  ['values'], idx: 3
  }),
  'argmin': measure({
    name: 'argmin',
    add:  'if (v < this.min) this.argmin = t;',
    rem:  'if (v <= this.min) this.argmin = null;',
    set:  'this.argmin = this.argmin || cell.data.argmin(this.get)',
    req:  ['min'], str: ['values'], idx: 3
  }),
  'argmax': measure({
    name: 'argmax',
    add:  'if (v > this.max) this.argmax = t;',
    rem:  'if (v >= this.max) this.argmax = null;',
    set:  'this.argmax = this.argmax || cell.data.argmax(this.get)',
    req:  ['max'], str: ['values'], idx: 3
  }),
  'min': measure({
    name: 'min',
    init: 'this.min = +Infinity;',
    add:  'if (v < this.min) this.min = v;',
    rem:  'if (v <= this.min) this.min = NaN;',
    set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
    str:  ['values'], idx: 4
  }),
  'max': measure({
    name: 'max',
    init: 'this.max = -Infinity;',
    add:  'if (v > this.max) this.max = v;',
    rem:  'if (v >= this.max) this.max = NaN;',
    set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
    str:  ['values'], idx: 4
  }),
  'modeskew': measure({
    name: 'modeskew',
    set:  'this.dev===0 ? 0 : (this.mean - cell.data.q2(this.get)) / Math.sqrt(this.dev/(this.valid-1))',
    req:  ['mean', 'stdev', 'median'], idx: 5
  })
};

function measure(base) {
  return function(out) {
    var m = util.extend({init:'', add:'', rem:'', idx:0}, base);
    m.out = out || base.name;
    return m;
  };
}

function resolve(agg, stream) {
  function collect(m, a) {
    function helper(r) { if (!m[r]) collect(m, m[r] = types[r]()); }
    if (a.req) a.req.forEach(helper);
    if (stream && a.str) a.str.forEach(helper);
    return m;
  }
  var map = agg.reduce(
    collect,
    agg.reduce(function(m, a) { return (m[a.name] = a, m); }, {})
  );
  return util.vals(map).sort(function(a, b) { return a.idx - b.idx; });
}

function create(agg, stream, accessor, mutator) {
  var all = resolve(agg, stream),
      ctr = 'this.cell = cell; this.tuple = t; this.valid = 0; this.missing = 0;',
      add = 'if (v==null) this.missing++; if (!this.isValid(v)) return; ++this.valid;',
      rem = 'if (v==null) this.missing--; if (!this.isValid(v)) return; --this.valid;',
      set = 'var t = this.tuple; var cell = this.cell;';

  all.forEach(function(a) {
    if (a.idx < 0) {
      ctr = a.init + ctr;
      add = a.add + add;
      rem = a.rem + rem;
    } else {
      ctr += a.init;
      add += a.add;
      rem += a.rem;
    }
  });
  agg.slice()
    .sort(function(a, b) { return a.idx - b.idx; })
    .forEach(function(a) {
      set += 'this.assign(t,\''+a.out+'\','+a.set+');';
    });
  set += 'return t;';

  /* jshint evil: true */
  ctr = Function('cell', 't', ctr);
  ctr.prototype.assign = mutator;
  ctr.prototype.add = Function('t', 'var v = this.get(t);' + add);
  ctr.prototype.rem = Function('t', 'var v = this.get(t);' + rem);
  ctr.prototype.set = Function(set);
  ctr.prototype.get = accessor;
  ctr.prototype.distinct = require('../stats').count.distinct;
  ctr.prototype.isValid = util.isValid;
  ctr.fields = agg.map(util.$('out'));
  return ctr;
}

types.create = create;
module.exports = types;

},{"../stats":27,"../util":30}],12:[function(require,module,exports){
var util = require('../util'),
    time = require('../time'),
    EPSILON = 1e-15;

function bins(opt) {
  if (!opt) { throw Error("Missing binning options."); }

  // determine range
  var maxb = opt.maxbins || 15,
      base = opt.base || 10,
      logb = Math.log(base),
      div = opt.div || [5, 2],
      min = opt.min,
      max = opt.max,
      span = max - min,
      step, level, minstep, precision, v, i, eps;

  if (opt.step) {
    // if step size is explicitly given, use that
    step = opt.step;
  } else if (opt.steps) {
    // if provided, limit choice to acceptable step sizes
    step = opt.steps[Math.min(
      opt.steps.length - 1,
      bisect(opt.steps, span/maxb, 0, opt.steps.length)
    )];
  } else {
    // else use span to determine step size
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = opt.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );

    // increase step size if too many bins
    while (Math.ceil(span/step) > maxb) { step *= base; }

    // decrease step size if allowed
    for (i=0; i<div.length; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  min = Math.min(min, Math.floor(min / step + eps) * step);
  max = Math.ceil(max / step) * step;

  return {
    start: min,
    stop:  max,
    step:  step,
    unit:  {precision: precision},
    value: value,
    index: index
  };
}

function bisect(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (util.cmp(a[mid], x) < 0) { lo = mid + 1; }
    else { hi = mid; }
  }
  return lo;
}

function value(v) {
  return this.step * Math.floor(v / this.step + EPSILON);
}

function index(v) {
  return Math.floor((v - this.start) / this.step + EPSILON);
}

function date_value(v) {
  return this.unit.date(value.call(this, v));
}

function date_index(v) {
  return index.call(this, this.unit.unit(v));
}

bins.date = function(opt) {
  if (!opt) { throw Error("Missing date binning options."); }

  // find time step, then bin
  var units = opt.utc ? time.utc : time,
      dmin = opt.min,
      dmax = opt.max,
      maxb = opt.maxbins || 20,
      minb = opt.minbins || 4,
      span = (+dmax) - (+dmin),
      unit = opt.unit ? units[opt.unit] : units.find(span, minb, maxb),
      spec = bins({
        min:     unit.min != null ? unit.min : unit.unit(dmin),
        max:     unit.max != null ? unit.max : unit.unit(dmax),
        maxbins: maxb,
        minstep: unit.minstep,
        steps:   unit.step
      });

  spec.unit = unit;
  spec.index = date_index;
  if (!opt.raw) spec.value = date_value;
  return spec;
};

module.exports = bins;

},{"../time":29,"../util":30}],13:[function(require,module,exports){
var bins = require('./bins'),
    gen  = require('../generate'),
    type = require('../import/type'),
    util = require('../util'),
    stats = require('../stats');

var qtype = {
  'integer': 1,
  'number': 1,
  'date': 1
};

function $bin(values, f, opt) {
  opt = options(values, f, opt);
  var b = spec(opt);
  return !b ? (opt.accessor || util.identity) :
    util.$func('bin', b.unit.unit ?
      function(x) { return b.value(b.unit.unit(x)); } :
      function(x) { return b.value(x); }
    )(opt.accessor);
}

function histogram(values, f, opt) {
  opt = options(values, f, opt);
  var b = spec(opt);
  return b ?
    numerical(values, opt.accessor, b) :
    categorical(values, opt.accessor, opt && opt.sort);
}

function spec(opt) {
  var t = opt.type, b = null;
  if (t == null || qtype[t]) {
    if (t === 'integer' && opt.minstep == null) opt.minstep = 1;
    b = (t === 'date') ? bins.date(opt) : bins(opt);
  }
  return b;
}

function options() {
  var a = arguments,
      i = 0,
      values = util.isArray(a[i]) ? a[i++] : null,
      f = util.isFunction(a[i]) || util.isString(a[i]) ? util.$(a[i++]) : null,
      opt = util.extend({}, a[i]);

  if (values) {
    opt.type = opt.type || type(values, f);
    if (qtype[opt.type]) {
      var ext = stats.extent(values, f);
      opt = util.extend({min: ext[0], max: ext[1]}, opt);
    }
  }
  if (f) { opt.accessor = f; }
  return opt;
}

function numerical(values, f, b) {
  var h = gen.range(b.start, b.stop + b.step/2, b.step)
    .map(function(v) { return {value: b.value(v), count: 0}; });

  for (var i=0, v, j; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      j = b.index(v);
      if (j < 0 || j >= h.length || !isFinite(j)) continue;
      h[j].count += 1;
    }
  }
  h.bins = b;
  return h;
}

function categorical(values, f, sort) {
  var u = stats.unique(values, f),
      c = stats.count.map(values, f);
  return u.map(function(k) { return {value: k, count: c[k]}; })
    .sort(util.comparator(sort ? '-count' : '+value'));
}

module.exports = {
  $bin: $bin,
  histogram: histogram
};

},{"../generate":16,"../import/type":25,"../stats":27,"../util":30,"./bins":12}],14:[function(require,module,exports){
var util = require('./util'),
    type = require('./import/type'),
    stats = require('./stats'),
    template = require('./template');

module.exports = {
  table:   formatTable,  // format a data table
  summary: formatSummary // format a data table summary
};

var FMT = {
  'date':    '|time:"%m/%d/%Y %H:%M:%S"',
  'number':  '|number:".4f"',
  'integer': '|number:"d"'
};

var POS = {
  'number':  'left',
  'integer': 'left'
};

function formatTable(data, opt) {
  opt = util.extend({separator:' ', minwidth: 8, maxwidth: 15}, opt);
  var fields = opt.fields || util.keys(data[0]),
      types = type.all(data);

  if (opt.start || opt.limit) {
    var a = opt.start || 0,
        b = opt.limit ? a + opt.limit : data.length;
    data = data.slice(a, b);
  }

  // determine char width of fields
  var lens = fields.map(function(name) {
    var format = FMT[types[name]] || '',
        t = template('{{' + name + format + '}}'),
        l = stats.max(data, function(x) { return t(x).length; });
    l = Math.max(Math.min(name.length, opt.minwidth), l);
    return opt.maxwidth > 0 ? Math.min(l, opt.maxwidth) : l;
  });

  // print header row
  var head = fields.map(function(name, i) {
    return util.truncate(util.pad(name, lens[i], 'center'), lens[i]);
  }).join(opt.separator);

  // build template function for each row
  var tmpl = template(fields.map(function(name, i) {
    return '{{' +
      name +
      (FMT[types[name]] || '') +
      ('|pad:' + lens[i] + ',' + (POS[types[name]] || 'right')) +
      ('|truncate:' + lens[i]) +
    '}}';
  }).join(opt.separator));

  // print table
  return head + "\n" + data.map(tmpl).join('\n');
}

function formatSummary(s) {
  s = s ? s.__summary__ ? s : stats.summary(s) : this;
  var str = [], i, n;
  for (i=0, n=s.length; i<n; ++i) {
    str.push('-- ' + s[i].field + ' --');
    if (s[i].type === 'string' || s[i].distinct < 10) {
      str.push(printCategoricalProfile(s[i]));
    } else {
      str.push(printQuantitativeProfile(s[i]));
    }
    str.push('');
  }
  return str.join('\n');
}

function printQuantitativeProfile(p) {
  return [
    'valid:    ' + p.valid,
    'missing:  ' + p.missing,
    'distinct: ' + p.distinct,
    'min:      ' + p.min,
    'max:      ' + p.max,
    'median:   ' + p.median,
    'mean:     ' + p.mean,
    'stdev:    ' + p.stdev,
    'modeskew: ' + p.modeskew
  ].join('\n');
}

function printCategoricalProfile(p) {
  var list = [
    'valid:    ' + p.valid,
    'missing:  ' + p.missing,
    'distinct: ' + p.distinct,
    'top values: '
  ];
  var u = p.unique;
  var top = util.keys(u)
    .sort(function(a,b) { return u[b] - u[a]; })
    .slice(0, 6)
    .map(function(v) { return ' \'' + v + '\' (' + u[v] + ')'; });
  return list.concat(top).join('\n');
}
},{"./import/type":25,"./stats":27,"./template":28,"./util":30}],15:[function(require,module,exports){
var util = require('./util'),
    d3_time = require('d3-time'),
    d3_timeF = require('d3-time-format'),
    d3_numberF = require('d3-format'),
    numberF = d3_numberF, // defaults to EN-US
    timeF = d3_timeF,     // defaults to EN-US
    tmpDate = new Date(2000, 0, 1),
    monthFull, monthAbbr, dayFull, dayAbbr;


module.exports = {
  // Update number formatter to use provided locale configuration.
  // For more see https://github.com/d3/d3-format
  numberLocale: numberLocale,
  number:       function(f) { return numberF.format(f); },
  numberPrefix: function(f, v) { return numberF.formatPrefix(f, v); },

  // Update time formatter to use provided locale configuration.
  // For more see https://github.com/d3/d3-time-format
  timeLocale:   timeLocale,
  time:         function(f) { return timeF.format(f); },
  utc:          function(f) { return timeF.utcFormat(f); },

  // Set number and time locale simultaneously.
  locale:       function(l) { numberLocale(l); timeLocale(l); },

  // automatic formatting functions
  auto: {
    number:   autoNumberFormat,
    linear:   linearNumberFormat,
    time:     function() { return timeAutoFormat(); },
    utc:      function() { return utcAutoFormat(); }
  },

  month: monthFormat, // format month name from integer code
  day:   dayFormat    // format week day name from integer code
};

// -- Locales ----

// transform 'en-US' style locale string to match d3-format v0.4+ convention
function localeRef(l) {
  return l.length > 4 && 'locale' + (
    l[0].toUpperCase() + l[1].toLowerCase() +
    l[3].toUpperCase() + l[4].toLowerCase()
  );
}

function numberLocale(l) {
  var f = util.isString(l) ? d3_numberF[localeRef(l)] : d3_numberF.locale(l);
  if (f == null) throw Error('Unrecognized locale: ' + l);
  numberF = f;
}

function timeLocale(l) {
  var f = util.isString(l) ? d3_timeF[localeRef(l)] : d3_timeF.locale(l);
  if (f == null) throw Error('Unrecognized locale: ' + l);
  timeF = f;
  monthFull = monthAbbr = dayFull = dayAbbr = null;
}

// -- Number Formatting ----

var e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);

function linearRange(domain, count) {
  if (!domain.length) domain = [0];
  if (count == null) count = 10;

  var start = domain[0],
      stop = domain[domain.length - 1];

  if (stop < start) { error = stop; stop = start; start = error; }

  var span = (stop - start) || (count = 1, start || stop || 1),
      step = Math.pow(10, Math.floor(Math.log(span / count) / Math.LN10)),
      error = span / count / step;

  // Filter ticks to get closer to the desired count.
  if (error >= e10) step *= 10;
  else if (error >= e5) step *= 5;
  else if (error >= e2) step *= 2;

  // Round start and stop values to step interval.
  return [
    Math.ceil(start / step) * step,
    Math.floor(stop / step) * step + step / 2, // inclusive
    step
  ];
}

function trimZero(f, decimal) {
  return function(x) {
    var s = f(x),
        n = s.indexOf(decimal);
    if (n < 0) return s;

    var idx = rightmostDigit(s, n),
        end = idx < s.length ? s.slice(idx) : '';

    while (--idx > n) {
      if (s[idx] !== '0') { ++idx; break; }
    }
    return s.slice(0, idx) + end;
  };
}

function rightmostDigit(s, n) {
  var i = s.lastIndexOf('e'), c;
  if (i > 0) return i;
  for (i=s.length; --i > n;) {
    c = s.charCodeAt(i);
    if (c >= 48 && c <= 57) return i+1; // is digit
  }
}

function autoNumberFormat(f) {
  var decimal = numberF.format('.1f')(1)[1]; // get decimal char
  if (f == null) f = ',';
  f = d3_numberF.formatSpecifier(f);
  if (f.precision == null) f.precision = 12;
  switch (f.type) {
    case '%': f.precision -= 2; break;
    case 'e': f.precision -= 1; break;
  }
  return trimZero(numberF.format(f), decimal);
}

function linearNumberFormat(domain, count, f) {
  var range = linearRange(domain, count);

  if (f == null) f = ',f';

  switch (f = d3_numberF.formatSpecifier(f), f.type) {
    case 's': {
      var value = Math.max(Math.abs(range[0]), Math.abs(range[1]));
      if (f.precision == null) f.precision = d3_numberF.precisionPrefix(range[2], value);
      return numberF.formatPrefix(f, value);
    }
    case '':
    case 'e':
    case 'g':
    case 'p':
    case 'r': {
      if (f.precision == null) f.precision = d3_numberF.precisionRound(range[2], Math.max(Math.abs(range[0]), Math.abs(range[1]))) - (f.type === 'e');
      break;
    }
    case 'f':
    case '%': {
      if (f.precision == null) f.precision = d3_numberF.precisionFixed(range[2]) - 2 * (f.type === '%');
      break;
    }
  }
  return numberF.format(f);
}

// -- Datetime Formatting ----

function timeAutoFormat() {
  var f = timeF.format,
      formatMillisecond = f('.%L'),
      formatSecond = f(':%S'),
      formatMinute = f('%I:%M'),
      formatHour = f('%I %p'),
      formatDay = f('%a %d'),
      formatWeek = f('%b %d'),
      formatMonth = f('%B'),
      formatYear = f('%Y');

  return function(date) {
    var d = +date;
    return (d3_time.second(date) < d ? formatMillisecond
        : d3_time.minute(date) < d ? formatSecond
        : d3_time.hour(date) < d ? formatMinute
        : d3_time.day(date) < d ? formatHour
        : d3_time.month(date) < d ?
          (d3_time.week(date) < d ? formatDay : formatWeek)
        : d3_time.year(date) < d ? formatMonth
        : formatYear)(date);
  };
}

function utcAutoFormat() {
  var f = timeF.utcFormat,
      formatMillisecond = f('.%L'),
      formatSecond = f(':%S'),
      formatMinute = f('%I:%M'),
      formatHour = f('%I %p'),
      formatDay = f('%a %d'),
      formatWeek = f('%b %d'),
      formatMonth = f('%B'),
      formatYear = f('%Y');

  return function(date) {
    var d = +date;
    return (d3_time.utcSecond(date) < d ? formatMillisecond
        : d3_time.utcMinute(date) < d ? formatSecond
        : d3_time.utcHour(date) < d ? formatMinute
        : d3_time.utcDay(date) < d ? formatHour
        : d3_time.utcMonth(date) < d ?
          (d3_time.utcWeek(date) < d ? formatDay : formatWeek)
        : d3_time.utcYear(date) < d ? formatMonth
        : formatYear)(date);
  };
}

function monthFormat(month, abbreviate) {
  var f = abbreviate ?
    (monthAbbr || (monthAbbr = timeF.format('%b'))) :
    (monthFull || (monthFull = timeF.format('%B')));
  return (tmpDate.setMonth(month), f(tmpDate));
}

function dayFormat(day, abbreviate) {
  var f = abbreviate ?
    (dayAbbr || (dayAbbr = timeF.format('%a'))) :
    (dayFull || (dayFull = timeF.format('%A')));
  return (tmpDate.setMonth(0), tmpDate.setDate(2 + day), f(tmpDate));
}
},{"./util":30,"d3-format":3,"d3-time":5,"d3-time-format":4}],16:[function(require,module,exports){
var util = require('./util'),
    gen = module.exports;

gen.repeat = function(val, n) {
  var a = Array(n), i;
  for (i=0; i<n; ++i) a[i] = val;
  return a;
};

gen.zeros = function(n) {
  return gen.repeat(0, n);
};

gen.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step == Infinity) throw new Error('Infinite range');
  var range = [], i = -1, j;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j);
  else while ((j = start + step * ++i) < stop) range.push(j);
  return range;
};

gen.random = {};

gen.random.uniform = function(min, max) {
  if (max === undefined) {
    max = min === undefined ? 1 : min;
    min = 0;
  }
  var d = max - min;
  var f = function() {
    return min + d * Math.random();
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    return (x >= min && x <= max) ? 1/d : 0;
  };
  f.cdf = function(x) {
    return x < min ? 0 : x > max ? 1 : (x - min) / d;
  };
  f.icdf = function(p) {
    return (p >= 0 && p <= 1) ? min + p*d : NaN;
  };
  return f;
};

gen.random.integer = function(a, b) {
  if (b === undefined) {
    b = a;
    a = 0;
  }
  var d = b - a;
  var f = function() {
    return a + Math.floor(d * Math.random());
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1/d : 0;
  };
  f.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };
  f.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p*d) : NaN;
  };
  return f;
};

gen.random.normal = function(mean, stdev) {
  mean = mean || 0;
  stdev = stdev || 1;
  var next;
  var f = function() {
    var x = 0, y = 0, rds, c;
    if (next !== undefined) {
      x = next;
      next = undefined;
      return x;
    }
    do {
      x = Math.random()*2-1;
      y = Math.random()*2-1;
      rds = x*x + y*y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2*Math.log(rds)/rds); // Box-Muller transform
    next = mean + y*c*stdev;
    return mean + x*c*stdev;
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  f.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mean, 2) / (-2 * Math.pow(stdev, 2)));
    return (1 / (stdev * Math.sqrt(2*Math.PI))) * exp;
  };
  f.cdf = function(x) {
    // Approximation from West (2009)
    // Better Approximations to Cumulative Normal Functions
    var cd,
        z = (x - mean) / stdev,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum = sum * Z + 6.37396220353165;
        sum = sum * Z + 33.912866078383;
        sum = sum * Z + 112.079291497871;
        sum = sum * Z + 221.213596169931;
        sum = sum * Z + 220.206867912376;
        cd = exp * sum;
        sum = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum = sum * Z + 16.064177579207;
        sum = sum * Z + 86.7807322029461;
        sum = sum * Z + 296.564248779674;
        sum = sum * Z + 637.333633378831;
        sum = sum * Z + 793.826512519948;
        sum = sum * Z + 440.413735824752;
        cd = cd / sum;
      } else {
        sum = Z + 0.65;
        sum = Z + 4 / sum;
        sum = Z + 3 / sum;
        sum = Z + 2 / sum;
        sum = Z + 1 / sum;
        cd = exp / sum / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };
  f.icdf = function(p) {
    // Approximation of Probit function using inverse error function.
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mean + stdev * Math.SQRT2 * s;
  };
  return f;
};

gen.random.bootstrap = function(domain, smooth) {
  // Generates a bootstrap sample from a set of observations.
  // Smooth bootstrapping adds random zero-centered noise to the samples.
  var val = domain.filter(util.isValid),
      len = val.length,
      err = smooth ? gen.random.normal(0, smooth) : null;
  var f = function() {
    return val[~~(Math.random()*len)] + (err ? err() : 0);
  };
  f.samples = function(n) {
    return gen.zeros(n).map(f);
  };
  return f;
};
},{"./util":30}],17:[function(require,module,exports){
var util = require('../../util');
var d3_dsv = require('d3-dsv');

function dsv(data, format) {
  if (data) {
    var h = format.header;
    data = (h ? h.join(format.delimiter) + '\n' : '') + data;
  }
  return d3_dsv.dsv(format.delimiter).parse(data);
}

dsv.delimiter = function(delim) {
  var fmt = {delimiter: delim};
  return function(data, format) {
    return dsv(data, format ? util.extend(format, fmt) : fmt);
  };
};

module.exports = dsv;

},{"../../util":30,"d3-dsv":2}],18:[function(require,module,exports){
var dsv = require('./dsv');

module.exports = {
  json: require('./json'),
  topojson: require('./topojson'),
  treejson: require('./treejson'),
  dsv: dsv,
  csv: dsv.delimiter(','),
  tsv: dsv.delimiter('\t')
};

},{"./dsv":17,"./json":19,"./topojson":20,"./treejson":21}],19:[function(require,module,exports){
var util = require('../../util');

module.exports = function(data, format) {
  var d = util.isObject(data) && !util.isBuffer(data) ?
    data : JSON.parse(data);
  if (format && format.property) {
    d = util.accessor(format.property)(d);
  }
  return d;
};

},{"../../util":30}],20:[function(require,module,exports){
var json = require('./json');

var reader = function(data, format) {
  var topojson = reader.topojson;
  if (topojson == null) { throw Error('TopoJSON library not loaded.'); }

  var t = json(data, format), obj;

  if (format && format.feature) {
    if ((obj = t.objects[format.feature])) {
      return topojson.feature(t, obj).features;
    } else {
      throw Error('Invalid TopoJSON object: ' + format.feature);
    }
  } else if (format && format.mesh) {
    if ((obj = t.objects[format.mesh])) {
      return [topojson.mesh(t, t.objects[format.mesh])];
    } else {
      throw Error('Invalid TopoJSON object: ' + format.mesh);
    }
  } else {
    throw Error('Missing TopoJSON feature or mesh parameter.');
  }
};

reader.topojson = require('topojson');
module.exports = reader;

},{"./json":19,"topojson":6}],21:[function(require,module,exports){
var json = require('./json');

module.exports = function(tree, format) {
  return toTable(json(tree, format), format);
};

function toTable(root, fields) {
  var childrenField = fields && fields.children || 'children',
      parentField = fields && fields.parent || 'parent',
      table = [];

  function visit(node, parent) {
    node[parentField] = parent;
    table.push(node);
    var children = node[childrenField];
    if (children) {
      for (var i=0; i<children.length; ++i) {
        visit(children[i], node);
      }
    }
  }

  visit(root, null);
  return (table.root = root, table);
}

},{"./json":19}],22:[function(require,module,exports){
var util = require('../util');

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

// Validate and cleanup URL to ensure that it is allowed to be accessed
// Returns cleaned up URL, or false if access is not allowed
function sanitizeUrl(opt) {
  var url = opt.url;
  if (!url && opt.file) { return fileProtocol + opt.file; }

  // In case this is a relative url (has no host), prepend opt.baseURL
  if (opt.baseURL && !protocol_re.test(url)) {
    if (!startsWith(url, '/') && opt.baseURL[opt.baseURL.length-1] !== '/') {
      url = '/' + url; // Ensure that there is a slash between the baseURL (e.g. hostname) and url
    }
    url = opt.baseURL + url;
  }
  // relative protocol, starts with '//'
  if (!load.useXHR && startsWith(url, '//')) {
    url = (opt.defaultProtocol || 'http') + ':' + url;
  }
  // If opt.domainWhiteList is set, only allows url, whose hostname
  // * Is the same as the origin (window.location.hostname)
  // * Equals one of the values in the whitelist
  // * Is a proper subdomain of one of the values in the whitelist
  if (opt.domainWhiteList) {
    var domain, origin;
    if (load.useXHR) {
      var a = document.createElement('a');
      a.href = url;
      // From http://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
      // IE doesn't populate all link properties when setting .href with a relative URL,
      // however .href will return an absolute URL which then can be used on itself
      // to populate these additional fields.
      if (a.host === '') {
        a.href = a.href;
      }
      domain = a.hostname.toLowerCase();
      origin = window.location.hostname;
    } else {
      // relative protocol is broken: https://github.com/defunctzombie/node-url/issues/5
      var parts = require('url').parse(url);
      domain = parts.hostname;
      origin = null;
    }

    if (origin !== domain) {
      var whiteListed = opt.domainWhiteList.some(function(d) {
        var idx = domain.length - d.length;
        return d === domain ||
          (idx > 1 && domain[idx-1] === '.' && domain.lastIndexOf(d) === idx);
      });
      if (!whiteListed) {
        throw 'URL is not whitelisted: ' + url;
      }
    }
  }
  return url;
}

function load(opt, callback) {
  return load.loader(opt, callback);
}

function loader(opt, callback) {
  var error = callback || function(e) { throw e; }, url;

  try {
    url = load.sanitizeUrl(opt); // enable override
  } catch (err) {
    error(err);
    return;
  }

  if (!url) {
    error('Invalid URL: ' + opt.url);
  } else if (load.useXHR) {
    // on client, use xhr
    return load.xhr(url, opt, callback);
  } else if (startsWith(url, fileProtocol)) {
    // on server, if url starts with 'file://', strip it and load from file
    return load.file(url.slice(fileProtocol.length), opt, callback);
  } else if (url.indexOf('://') < 0) { // TODO better protocol check?
    // on server, if no protocol assume file
    return load.file(url, opt, callback);
  } else {
    // for regular URLs on server
    return load.http(url, opt, callback);
  }
}

function xhrHasResponse(request) {
  var type = request.responseType;
  return type && type !== 'text' ?
    request.response : // null on error
    request.responseText; // '' on error
}

function xhr(url, opt, callback) {
  var async = !!callback;
  var request = new XMLHttpRequest();
  // If IE does not support CORS, use XDomainRequest (copied from d3.xhr)
  if (typeof XDomainRequest !== 'undefined' &&
      !('withCredentials' in request) &&
      /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();

  function respond() {
    var status = request.status;
    if (!status && xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
      callback(null, request.responseText);
    } else {
      callback(request, null);
    }
  }

  if (async) {
    if ('onload' in request) {
      request.onload = request.onerror = respond;
    } else {
      request.onreadystatechange = function() {
        if (request.readyState > 3) respond();
      };
    }
  }

  request.open('GET', url, async);
  /* istanbul ignore else */
  if (request.setRequestHeader) {
    var headers = util.extend({}, load.headers, opt.headers);
    for (var name in headers) {
      request.setRequestHeader(name, headers[name]);
    }
  }
  request.send();

  if (!async && xhrHasResponse(request)) {
    return request.responseText;
  }
}

function file(filename, opt, callback) {
  var fs = require('fs');
  if (!callback) {
    return fs.readFileSync(filename, 'utf8');
  }
  fs.readFile(filename, callback);
}

function http(url, opt, callback) {
  var headers = util.extend({}, load.headers, opt.headers);

  if (!callback) {
    return require('sync-request')('GET', url, {headers: headers}).getBody();
  }

  var options = {url: url, encoding: null, gzip: true, headers: headers};
  require('request')(options, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(null, body);
    } else {
      error = error ||
        'Load failed with response code ' + response.statusCode + '.';
      callback(error, null);
    }
  });
}

function startsWith(string, searchString) {
  return string == null ? false : string.lastIndexOf(searchString, 0) === 0;
}

// Allow these functions to be overriden by the user of the library
load.loader = loader;
load.sanitizeUrl = sanitizeUrl;
load.xhr = xhr;
load.file = file;
load.http = http;

// Default settings
load.useXHR = (typeof XMLHttpRequest !== 'undefined');
load.headers = {};

module.exports = load;

},{"../util":30,"fs":1,"request":1,"sync-request":1,"url":1}],23:[function(require,module,exports){
var util = require('../util'),
  type = require('./type'),
  formats = require('./formats'),
  timeF = require('../format').time;

function read(data, format) {
  var type = (format && format.type) || 'json';
  data = formats[type](data, format);
  if (format && format.parse) parse(data, format.parse);
  return data;
}

function parse(data, types) {
  var cols, parsers, d, i, j, clen, len = data.length;

  types = (types==='auto') ? type.inferAll(data) : util.duplicate(types);
  cols = util.keys(types);
  parsers = cols.map(function(c) {
    var t = types[c];
    if (t && t.indexOf('date:') === 0) {
      var parts = t.split(':', 2),
          pattern = parts[1];
      if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
          (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
        pattern = pattern.slice(1, -1);
      } else {
        throw Error('Format pattern must be quoted: ' + pattern);
      }
      pattern = timeF(pattern);
      return function(v) { return pattern.parse(v); };
    }
    if (!type.parsers[t]) {
      throw Error('Illegal format pattern: ' + c + ':' + t);
    }
    return type.parsers[t];
  });

  for (i=0, clen=cols.length; i<len; ++i) {
    d = data[i];
    for (j=0; j<clen; ++j) {
      d[cols[j]] = parsers[j](d[cols[j]]);
    }
  }
  type.annotation(data, types);
}

read.formats = formats;
module.exports = read;

},{"../format":15,"../util":30,"./formats":18,"./type":25}],24:[function(require,module,exports){
var util = require('../util');
var load = require('./load');
var read = require('./read');

module.exports = util
  .keys(read.formats)
  .reduce(function(out, type) {
    out[type] = function(opt, format, callback) {
      // process arguments
      if (util.isString(opt)) { opt = {url: opt}; }
      if (arguments.length === 2 && util.isFunction(format)) {
        callback = format;
        format = undefined;
      }

      // set up read format
      format = util.extend({parse: 'auto'}, format);
      format.type = type;

      // load data
      var data = load(opt, callback ? function(error, data) {
        if (error) { callback(error, null); return; }
        try {
          // data loaded, now parse it (async)
          data = read(data, format);
          callback(null, data);
        } catch (e) {
          callback(e, null);
        }
      } : undefined);

      // data loaded, now parse it (sync)
      if (!callback) return read(data, format);
    };
    return out;
  }, {});

},{"../util":30,"./load":22,"./read":23}],25:[function(require,module,exports){
var util = require('../util');

var TYPES = '__types__';

var PARSERS = {
  boolean: util.boolean,
  integer: util.number,
  number:  util.number,
  date:    util.date,
  string:  function(x) { return x==='' ? null : x; }
};

var TESTS = {
  boolean: function(x) { return x==='true' || x==='false' || util.isBoolean(x); },
  integer: function(x) { return TESTS.number(x) && (x=+x) === ~~x; },
  number: function(x) { return !isNaN(+x) && !util.isDate(x); },
  date: function(x) { return !isNaN(Date.parse(x)); }
};

function annotation(data, types) {
  if (!types) return data && data[TYPES] || null;
  data[TYPES] = types;
}

function type(values, f) {
  values = util.array(values);
  f = util.$(f);
  var v, i, n;

  // if data array has type annotations, use them
  if (values[TYPES]) {
    v = f(values[TYPES]);
    if (util.isString(v)) return v;
  }

  for (i=0, n=values.length; !util.isValid(v) && i<n; ++i) {
    v = f ? f(values[i]) : values[i];
  }

  return util.isDate(v) ? 'date' :
    util.isNumber(v)    ? 'number' :
    util.isBoolean(v)   ? 'boolean' :
    util.isString(v)    ? 'string' : null;
}

function typeAll(data, fields) {
  if (!data.length) return;
  fields = fields || util.keys(data[0]);
  return fields.reduce(function(types, f) {
    return (types[f] = type(data, f), types);
  }, {});
}

function infer(values, f) {
  values = util.array(values);
  f = util.$(f);
  var i, j, v;

  // types to test for, in precedence order
  var types = ['boolean', 'integer', 'number', 'date'];

  for (i=0; i<values.length; ++i) {
    // get next value to test
    v = f ? f(values[i]) : values[i];
    // test value against remaining types
    for (j=0; j<types.length; ++j) {
      if (util.isValid(v) && !TESTS[types[j]](v)) {
        types.splice(j, 1);
        j -= 1;
      }
    }
    // if no types left, return 'string'
    if (types.length === 0) return 'string';
  }

  return types[0];
}

function inferAll(data, fields) {
  fields = fields || util.keys(data[0]);
  return fields.reduce(function(types, f) {
    types[f] = infer(data, f);
    return types;
  }, {});
}

type.annotation = annotation;
type.all = typeAll;
type.infer = infer;
type.inferAll = inferAll;
type.parsers = PARSERS;
module.exports = type;

},{"../util":30}],26:[function(require,module,exports){
var util = require('./util');

var dl = {
  version:    '1.6.3',
  load:       require('./import/load'),
  read:       require('./import/read'),
  type:       require('./import/type'),
  Aggregator: require('./aggregate/aggregator'),
  groupby:    require('./aggregate/groupby'),
  bins:       require('./bins/bins'),
  $bin:       require('./bins/histogram').$bin,
  histogram:  require('./bins/histogram').histogram,
  format:     require('./format'),
  template:   require('./template'),
  time:       require('./time')
};

util.extend(dl, util);
util.extend(dl, require('./accessor'));
util.extend(dl, require('./generate'));
util.extend(dl, require('./stats'));
util.extend(dl, require('./import/readers'));
util.extend(dl.format, require('./format-tables'));

// backwards-compatible, deprecated API
// will remove in the future
dl.print = {
  table:   dl.format.table,
  summary: dl.format.summary
};

module.exports = dl;

},{"./accessor":7,"./aggregate/aggregator":8,"./aggregate/groupby":10,"./bins/bins":12,"./bins/histogram":13,"./format":15,"./format-tables":14,"./generate":16,"./import/load":22,"./import/read":23,"./import/readers":24,"./import/type":25,"./stats":27,"./template":28,"./time":29,"./util":30}],27:[function(require,module,exports){
var util = require('./util');
var type = require('./import/type');
var gen = require('./generate');

var stats = module.exports;

// Collect unique values.
// Output: an array of unique values, in first-observed order
stats.unique = function(values, f, results) {
  f = util.$(f);
  results = results || [];
  var u = {}, v, i, n;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) continue;
    u[v] = 1;
    results.push(v);
  }
  return results;
};

// Return the length of the input array.
stats.count = function(values) {
  return values && values.length || 0;
};

// Count the number of non-null, non-undefined, non-NaN values.
stats.count.valid = function(values, f) {
  f = util.$(f);
  var v, i, n, valid = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) valid += 1;
  }
  return valid;
};

// Count the number of null or undefined values.
stats.count.missing = function(values, f) {
  f = util.$(f);
  var v, i, n, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v == null) count += 1;
  }
  return count;
};

// Count the number of distinct values.
// Null, undefined and NaN are each considered distinct values.
stats.count.distinct = function(values, f) {
  f = util.$(f);
  var u = {}, v, i, n, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) continue;
    u[v] = 1;
    count += 1;
  }
  return count;
};

// Construct a map from distinct values to occurrence counts.
stats.count.map = function(values, f) {
  f = util.$(f);
  var map = {}, v, i, n;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    map[v] = (v in map) ? map[v] + 1 : 1;
  }
  return map;
};

// Compute the median of an array of numbers.
stats.median = function(values, f) {
  if (f) values = values.map(util.$(f));
  values = values.filter(util.isValid).sort(util.cmp);
  return stats.quantile(values, 0.5);
};

// Computes the quartile boundaries of an array of numbers.
stats.quartile = function(values, f) {
  if (f) values = values.map(util.$(f));
  values = values.filter(util.isValid).sort(util.cmp);
  var q = stats.quantile;
  return [q(values, 0.25), q(values, 0.50), q(values, 0.75)];
};

// Compute the quantile of a sorted array of numbers.
// Adapted from the D3.js implementation.
stats.quantile = function(values, f, p) {
  if (p === undefined) { p = f; f = util.identity; }
  f = util.$(f);
  var H = (values.length - 1) * p + 1,
      h = Math.floor(H),
      v = +f(values[h - 1]),
      e = H - h;
  return e ? v + e * (f(values[h]) - v) : v;
};

// Compute the sum of an array of numbers.
stats.sum = function(values, f) {
  f = util.$(f);
  for (var sum=0, i=0, n=values.length, v; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) sum += v;
  }
  return sum;
};

// Compute the mean (average) of an array of numbers.
stats.mean = function(values, f) {
  f = util.$(f);
  var mean = 0, delta, i, n, c, v;
  for (i=0, c=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      delta = v - mean;
      mean = mean + delta / (++c);
    }
  }
  return mean;
};

// Compute the geometric mean of an array of numbers.
stats.mean.geometric = function(values, f) {
  f = util.$(f);
  var mean = 1, c, n, v, i;
  for (i=0, c=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      if (v <= 0) {
        throw Error("Geometric mean only defined for positive values.");
      }
      mean *= v;
      ++c;
    }
  }
  mean = c > 0 ? Math.pow(mean, 1/c) : 0;
  return mean;
};

// Compute the harmonic mean of an array of numbers.
stats.mean.harmonic = function(values, f) {
  f = util.$(f);
  var mean = 0, c, n, v, i;
  for (i=0, c=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      mean += 1/v;
      ++c;
    }
  }
  return c / mean;
};

// Compute the sample variance of an array of numbers.
stats.variance = function(values, f) {
  f = util.$(f);
  if (!util.isArray(values) || values.length < 2) return 0;
  var mean = 0, M2 = 0, delta, i, c, v;
  for (i=0, c=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      delta = v - mean;
      mean = mean + delta / (++c);
      M2 = M2 + delta * (v - mean);
    }
  }
  M2 = M2 / (c - 1);
  return M2;
};

// Compute the sample standard deviation of an array of numbers.
stats.stdev = function(values, f) {
  return Math.sqrt(stats.variance(values, f));
};

// Compute the Pearson mode skewness ((median-mean)/stdev) of an array of numbers.
stats.modeskew = function(values, f) {
  var avg = stats.mean(values, f),
      med = stats.median(values, f),
      std = stats.stdev(values, f);
  return std === 0 ? 0 : (avg - med) / std;
};

// Find the minimum value in an array.
stats.min = function(values, f) {
  return stats.extent(values, f)[0];
};

// Find the maximum value in an array.
stats.max = function(values, f) {
  return stats.extent(values, f)[1];
};

// Find the minimum and maximum of an array of values.
stats.extent = function(values, f) {
  f = util.$(f);
  var a, b, v, i, n = values.length;
  for (i=0; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) { a = b = v; break; }
  }
  for (; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      if (v < a) a = v;
      if (v > b) b = v;
    }
  }
  return [a, b];
};

// Find the integer indices of the minimum and maximum values.
stats.extent.index = function(values, f) {
  f = util.$(f);
  var x = -1, y = -1, a, b, v, i, n = values.length;
  for (i=0; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) { a = b = v; x = y = i; break; }
  }
  for (; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      if (v < a) { a = v; x = i; }
      if (v > b) { b = v; y = i; }
    }
  }
  return [x, y];
};

// Compute the dot product of two arrays of numbers.
stats.dot = function(values, a, b) {
  var sum = 0, i, v;
  if (!b) {
    if (values.length !== a.length) {
      throw Error('Array lengths must match.');
    }
    for (i=0; i<values.length; ++i) {
      v = values[i] * a[i];
      if (v === v) sum += v;
    }
  } else {
    a = util.$(a);
    b = util.$(b);
    for (i=0; i<values.length; ++i) {
      v = a(values[i]) * b(values[i]);
      if (v === v) sum += v;
    }
  }
  return sum;
};

// Compute the vector distance between two arrays of numbers.
// Default is Euclidean (exp=2) distance, configurable via exp argument.
stats.dist = function(values, a, b, exp) {
  var f = util.isFunction(b) || util.isString(b),
      X = values,
      Y = f ? values : a,
      e = f ? exp : b,
      L2 = e === 2 || e == null,
      n = values.length, s = 0, d, i;
  if (f) {
    a = util.$(a);
    b = util.$(b);
  }
  for (i=0; i<n; ++i) {
    d = f ? (a(X[i])-b(Y[i])) : (X[i]-Y[i]);
    s += L2 ? d*d : Math.pow(Math.abs(d), e);
  }
  return L2 ? Math.sqrt(s) : Math.pow(s, 1/e);
};

// Compute the Cohen's d effect size between two arrays of numbers.
stats.cohensd = function(values, a, b) {
  var X = b ? values.map(util.$(a)) : values,
      Y = b ? values.map(util.$(b)) : a,
      x1 = stats.mean(X),
      x2 = stats.mean(Y),
      n1 = stats.count.valid(X),
      n2 = stats.count.valid(Y);

  if ((n1+n2-2) <= 0) {
    // if both arrays are size 1, or one is empty, there's no effect size
    return 0;
  }
  // pool standard deviation
  var s1 = stats.variance(X),
      s2 = stats.variance(Y),
      s = Math.sqrt((((n1-1)*s1) + ((n2-1)*s2)) / (n1+n2-2));
  // if there is no variance, there's no effect size
  return s===0 ? 0 : (x1 - x2) / s;
};

// Computes the covariance between two arrays of numbers
stats.covariance = function(values, a, b) {
  var X = b ? values.map(util.$(a)) : values,
      Y = b ? values.map(util.$(b)) : a,
      n = X.length,
      xm = stats.mean(X),
      ym = stats.mean(Y),
      sum = 0, c = 0, i, x, y, vx, vy;

  if (n !== Y.length) {
    throw Error('Input lengths must match.');
  }

  for (i=0; i<n; ++i) {
    x = X[i]; vx = util.isValid(x);
    y = Y[i]; vy = util.isValid(y);
    if (vx && vy) {
      sum += (x-xm) * (y-ym);
      ++c;
    } else if (vx || vy) {
      throw Error('Valid values must align.');
    }
  }
  return sum / (c-1);
};

// Compute ascending rank scores for an array of values.
// Ties are assigned their collective mean rank.
stats.rank = function(values, f) {
  f = util.$(f) || util.identity;
  var a = values.map(function(v, i) {
      return {idx: i, val: f(v)};
    })
    .sort(util.comparator('val'));

  var n = values.length,
      r = Array(n),
      tie = -1, p = {}, i, v, mu;

  for (i=0; i<n; ++i) {
    v = a[i].val;
    if (tie < 0 && p === v) {
      tie = i - 1;
    } else if (tie > -1 && p !== v) {
      mu = 1 + (i-1 + tie) / 2;
      for (; tie<i; ++tie) r[a[tie].idx] = mu;
      tie = -1;
    }
    r[a[i].idx] = i + 1;
    p = v;
  }

  if (tie > -1) {
    mu = 1 + (n-1 + tie) / 2;
    for (; tie<n; ++tie) r[a[tie].idx] = mu;
  }

  return r;
};

// Compute the sample Pearson product-moment correlation of two arrays of numbers.
stats.cor = function(values, a, b) {
  var fn = b;
  b = fn ? values.map(util.$(b)) : a;
  a = fn ? values.map(util.$(a)) : values;

  var dot = stats.dot(a, b),
      mua = stats.mean(a),
      mub = stats.mean(b),
      sda = stats.stdev(a),
      sdb = stats.stdev(b),
      n = values.length;

  return (dot - n*mua*mub) / ((n-1) * sda * sdb);
};

// Compute the Spearman rank correlation of two arrays of values.
stats.cor.rank = function(values, a, b) {
  var ra = b ? stats.rank(values, a) : stats.rank(values),
      rb = b ? stats.rank(values, b) : stats.rank(a),
      n = values.length, i, s, d;

  for (i=0, s=0; i<n; ++i) {
    d = ra[i] - rb[i];
    s += d * d;
  }

  return 1 - 6*s / (n * (n*n-1));
};

// Compute the distance correlation of two arrays of numbers.
// http://en.wikipedia.org/wiki/Distance_correlation
stats.cor.dist = function(values, a, b) {
  var X = b ? values.map(util.$(a)) : values,
      Y = b ? values.map(util.$(b)) : a;

  var A = stats.dist.mat(X),
      B = stats.dist.mat(Y),
      n = A.length,
      i, aa, bb, ab;

  for (i=0, aa=0, bb=0, ab=0; i<n; ++i) {
    aa += A[i]*A[i];
    bb += B[i]*B[i];
    ab += A[i]*B[i];
  }

  return Math.sqrt(ab / Math.sqrt(aa*bb));
};

// Simple linear regression.
// Returns a "fit" object with slope (m), intercept (b),
// r value (R), and sum-squared residual error (rss).
stats.linearRegression = function(values, a, b) {
  var X = b ? values.map(util.$(a)) : values,
      Y = b ? values.map(util.$(b)) : a,
      n = X.length,
      xy = stats.covariance(X, Y), // will throw err if valid vals don't align
      sx = stats.stdev(X),
      sy = stats.stdev(Y),
      slope = xy / (sx*sx),
      icept = stats.mean(Y) - slope * stats.mean(X),
      fit = {slope: slope, intercept: icept, R: xy / (sx*sy), rss: 0},
      res, i;

  for (i=0; i<n; ++i) {
    if (util.isValid(X[i]) && util.isValid(Y[i])) {
      res = (slope*X[i] + icept) - Y[i];
      fit.rss += res * res;
    }
  }

  return fit;
};

// Namespace for bootstrap
stats.bootstrap = {};

// Construct a bootstrapped confidence interval at a given percentile level
// Arguments are an array, an optional n (defaults to 1000),
//  an optional alpha (defaults to 0.05), and an optional smoothing parameter
stats.bootstrap.ci = function(values, a, b, c, d) {
  var X, N, alpha, smooth, bs, means, i;
  if (util.isFunction(a) || util.isString(a)) {
    X = values.map(util.$(a));
    N = b;
    alpha = c;
    smooth = d;
  } else {
    X = values;
    N = a;
    alpha = b;
    smooth = c;
  }
  N = N ? +N : 1000;
  alpha = alpha || 0.05;

  bs = gen.random.bootstrap(X, smooth);
  for (i=0, means = Array(N); i<N; ++i) {
    means[i] = stats.mean(bs.samples(X.length));
  }
  means.sort(util.numcmp);
  return [
    stats.quantile(means, alpha/2),
    stats.quantile(means, 1-(alpha/2))
  ];
};

// Namespace for z-tests
stats.z = {};

// Construct a z-confidence interval at a given significance level
// Arguments are an array and an optional alpha (defaults to 0.05).
stats.z.ci = function(values, a, b) {
  var X = values, alpha = a;
  if (util.isFunction(a) || util.isString(a)) {
    X = values.map(util.$(a));
    alpha = b;
  }
  alpha = alpha || 0.05;

  var z = alpha===0.05 ? 1.96 : gen.random.normal(0, 1).icdf(1-(alpha/2)),
      mu = stats.mean(X),
      SE = stats.stdev(X) / Math.sqrt(stats.count.valid(X));
  return [mu - (z*SE), mu + (z*SE)];
};

// Perform a z-test of means. Returns the p-value.
// If a single array is provided, performs a one-sample location test.
// If two arrays or a table and two accessors are provided, performs
// a two-sample location test. A paired test is performed if specified
// by the options hash.
// The options hash format is: {paired: boolean, nullh: number}.
// http://en.wikipedia.org/wiki/Z-test
// http://en.wikipedia.org/wiki/Paired_difference_test
stats.z.test = function(values, a, b, opt) {
  if (util.isFunction(b) || util.isString(b)) { // table and accessors
    return (opt && opt.paired ? ztestP : ztest2)(opt, values, a, b);
  } else if (util.isArray(a)) { // two arrays
    return (b && b.paired ? ztestP : ztest2)(b, values, a);
  } else if (util.isFunction(a) || util.isString(a)) {
    return ztest1(b, values, a); // table and accessor
  } else {
    return ztest1(a, values); // one array
  }
};

// Perform a z-test of means. Returns the p-value.
// Assuming we have a list of values, and a null hypothesis. If no null
// hypothesis, assume our null hypothesis is mu=0.
function ztest1(opt, X, f) {
  var nullH = opt && opt.nullh || 0,
      gaussian = gen.random.normal(0, 1),
      mu = stats.mean(X,f),
      SE = stats.stdev(X,f) / Math.sqrt(stats.count.valid(X,f));

  if (SE===0) {
    // Test not well defined when standard error is 0.
    return (mu - nullH) === 0 ? 1 : 0;
  }
  // Two-sided, so twice the one-sided cdf.
  var z = (mu - nullH) / SE;
  return 2 * gaussian.cdf(-Math.abs(z));
}

// Perform a two sample paired z-test of means. Returns the p-value.
function ztestP(opt, values, a, b) {
  var X = b ? values.map(util.$(a)) : values,
      Y = b ? values.map(util.$(b)) : a,
      n1 = stats.count(X),
      n2 = stats.count(Y),
      diffs = Array(), i;

  if (n1 !== n2) {
    throw Error('Array lengths must match.');
  }
  for (i=0; i<n1; ++i) {
    // Only valid differences should contribute to the test statistic
    if (util.isValid(X[i]) && util.isValid(Y[i])) {
      diffs.push(X[i] - Y[i]);
    }
  }
  return stats.z.test(diffs, opt && opt.nullh || 0);
}

// Perform a two sample z-test of means. Returns the p-value.
function ztest2(opt, values, a, b) {
  var X = b ? values.map(util.$(a)) : values,
      Y = b ? values.map(util.$(b)) : a,
      n1 = stats.count.valid(X),
      n2 = stats.count.valid(Y),
      gaussian = gen.random.normal(0, 1),
      meanDiff = stats.mean(X) - stats.mean(Y) - (opt && opt.nullh || 0),
      SE = Math.sqrt(stats.variance(X)/n1 + stats.variance(Y)/n2);

  if (SE===0) {
    // Not well defined when pooled standard error is 0.
    return meanDiff===0 ? 1 : 0;
  }
  // Two-tailed, so twice the one-sided cdf.
  var z = meanDiff / SE;
  return 2 * gaussian.cdf(-Math.abs(z));
}

// Construct a mean-centered distance matrix for an array of numbers.
stats.dist.mat = function(X) {
  var n = X.length,
      m = n*n,
      A = Array(m),
      R = gen.zeros(n),
      M = 0, v, i, j;

  for (i=0; i<n; ++i) {
    A[i*n+i] = 0;
    for (j=i+1; j<n; ++j) {
      A[i*n+j] = (v = Math.abs(X[i] - X[j]));
      A[j*n+i] = v;
      R[i] += v;
      R[j] += v;
    }
  }

  for (i=0; i<n; ++i) {
    M += R[i];
    R[i] /= n;
  }
  M /= m;

  for (i=0; i<n; ++i) {
    for (j=i; j<n; ++j) {
      A[i*n+j] += M - R[i] - R[j];
      A[j*n+i] = A[i*n+j];
    }
  }

  return A;
};

// Compute the Shannon entropy (log base 2) of an array of counts.
stats.entropy = function(counts, f) {
  f = util.$(f);
  var i, p, s = 0, H = 0, n = counts.length;
  for (i=0; i<n; ++i) {
    s += (f ? f(counts[i]) : counts[i]);
  }
  if (s === 0) return 0;
  for (i=0; i<n; ++i) {
    p = (f ? f(counts[i]) : counts[i]) / s;
    if (p) H += p * Math.log(p);
  }
  return -H / Math.LN2;
};

// Compute the mutual information between two discrete variables.
// Returns an array of the form [MI, MI_distance]
// MI_distance is defined as 1 - I(a,b) / H(a,b).
// http://en.wikipedia.org/wiki/Mutual_information
stats.mutual = function(values, a, b, counts) {
  var x = counts ? values.map(util.$(a)) : values,
      y = counts ? values.map(util.$(b)) : a,
      z = counts ? values.map(util.$(counts)) : b;

  var px = {},
      py = {},
      n = z.length,
      s = 0, I = 0, H = 0, p, t, i;

  for (i=0; i<n; ++i) {
    px[x[i]] = 0;
    py[y[i]] = 0;
  }

  for (i=0; i<n; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }

  t = 1 / (s * Math.LN2);
  for (i=0; i<n; ++i) {
    if (z[i] === 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
    H += z[i] * t * Math.log(z[i]/s);
  }

  return [I, 1 + I/H];
};

// Compute the mutual information between two discrete variables.
stats.mutual.info = function(values, a, b, counts) {
  return stats.mutual(values, a, b, counts)[0];
};

// Compute the mutual information distance between two discrete variables.
// MI_distance is defined as 1 - I(a,b) / H(a,b).
stats.mutual.dist = function(values, a, b, counts) {
  return stats.mutual(values, a, b, counts)[1];
};

// Compute a profile of summary statistics for a variable.
stats.profile = function(values, f) {
  var mean = 0,
      valid = 0,
      missing = 0,
      distinct = 0,
      min = null,
      max = null,
      M2 = 0,
      vals = [],
      u = {}, delta, sd, i, v, x;

  // compute summary stats
  for (i=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];

    // update unique values
    u[v] = (v in u) ? u[v] + 1 : (distinct += 1, 1);

    if (v == null) {
      ++missing;
    } else if (util.isValid(v)) {
      // update stats
      x = (typeof v === 'string') ? v.length : v;
      if (min===null || x < min) min = x;
      if (max===null || x > max) max = x;
      delta = x - mean;
      mean = mean + delta / (++valid);
      M2 = M2 + delta * (x - mean);
      vals.push(x);
    }
  }
  M2 = M2 / (valid - 1);
  sd = Math.sqrt(M2);

  // sort values for median and iqr
  vals.sort(util.cmp);

  return {
    type:     type(values, f),
    unique:   u,
    count:    values.length,
    valid:    valid,
    missing:  missing,
    distinct: distinct,
    min:      min,
    max:      max,
    mean:     mean,
    stdev:    sd,
    median:   (v = stats.quantile(vals, 0.5)),
    q1:       stats.quantile(vals, 0.25),
    q3:       stats.quantile(vals, 0.75),
    modeskew: sd === 0 ? 0 : (mean - v) / sd
  };
};

// Compute profiles for all variables in a data set.
stats.summary = function(data, fields) {
  fields = fields || util.keys(data[0]);
  var s = fields.map(function(f) {
    var p = stats.profile(data, util.$(f));
    return (p.field = f, p);
  });
  return (s.__summary__ = true, s);
};

},{"./generate":16,"./import/type":25,"./util":30}],28:[function(require,module,exports){
var util = require('./util'),
    format = require('./format');

var context = {
  formats:    [],
  format_map: {},
  truncate:   util.truncate,
  pad:        util.pad,
  day:        format.day,
  month:      format.month
};

function template(text) {
  var src = source(text, 'd');
  src = 'var __t; return ' + src + ';';

  /* jshint evil: true */
  return (new Function('d', src)).bind(context);
}

template.source = source;
template.context = context;
template.format = get_format;
module.exports = template;

// Clear cache of format objects.
// This can *break* prior template functions, so invoke with care!
template.clearFormatCache = function() {
  context.formats = [];
  context.format_map = {};
};

// Generate property access code for use within template source.
// object: the name of the object (variable) containing template data
// property: the property access string, verbatim from template tag
template.property = function(object, property) {
  var src = util.field(property).map(util.str).join('][');
  return object + '[' + src + ']';
};

// Generate source code for a template function.
// text: the template text
// variable: the name of the data object variable ('obj' by default)
// properties: optional hash for collecting all accessed properties
function source(text, variable, properties) {
  variable = variable || 'obj';
  var index = 0;
  var src = '\'';
  var regex = template_re;

  // Compile the template source, escaping string literals appropriately.
  text.replace(regex, function(match, interpolate, offset) {
    src += text
      .slice(index, offset)
      .replace(template_escaper, template_escapeChar);
    index = offset + match.length;

    if (interpolate) {
      src += '\'\n+((__t=(' +
        template_var(interpolate, variable, properties) +
        '))==null?\'\':__t)+\n\'';
    }

    // Adobe VMs need the match returned to produce the correct offest.
    return match;
  });
  return src + '\'';
}

function template_var(text, variable, properties) {
  var filters = text.match(filter_re);
  var prop = filters.shift().trim();
  var stringCast = true;

  function strcall(fn) {
    fn = fn || '';
    if (stringCast) {
      stringCast = false;
      src = 'String(' + src + ')' + fn;
    } else {
      src += fn;
    }
    return src;
  }

  function date() {
    return '(typeof ' + src + '==="number"?new Date('+src+'):'+src+')';
  }

  function formatter(type) {
    var pattern = args[0];
    if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
        (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
      pattern = pattern.slice(1, -1);
    } else {
      throw Error('Format pattern must be quoted: ' + pattern);
    }
    a = template_format(pattern, type);
    stringCast = false;
    var arg = type === 'number' ? src : date();
    src = 'this.formats['+a+']('+arg+')';
  }

  if (properties) properties[prop] = 1;
  var src = template.property(variable, prop);

  for (var i=0; i<filters.length; ++i) {
    var f = filters[i], args = null, pidx, a, b;

    if ((pidx=f.indexOf(':')) > 0) {
      f = f.slice(0, pidx);
      args = filters[i].slice(pidx+1)
        .match(args_re)
        .map(function(s) { return s.trim(); });
    }
    f = f.trim();

    switch (f) {
      case 'length':
        strcall('.length');
        break;
      case 'lower':
        strcall('.toLowerCase()');
        break;
      case 'upper':
        strcall('.toUpperCase()');
        break;
      case 'lower-locale':
        strcall('.toLocaleLowerCase()');
        break;
      case 'upper-locale':
        strcall('.toLocaleUpperCase()');
        break;
      case 'trim':
        strcall('.trim()');
        break;
      case 'left':
        a = util.number(args[0]);
        strcall('.slice(0,' + a + ')');
        break;
      case 'right':
        a = util.number(args[0]);
        strcall('.slice(-' + a +')');
        break;
      case 'mid':
        a = util.number(args[0]);
        b = a + util.number(args[1]);
        strcall('.slice(+'+a+','+b+')');
        break;
      case 'slice':
        a = util.number(args[0]);
        strcall('.slice('+ a +
          (args.length > 1 ? ',' + util.number(args[1]) : '') +
          ')');
        break;
      case 'truncate':
        a = util.number(args[0]);
        b = args[1];
        b = (b!=='left' && b!=='middle' && b!=='center') ? 'right' : b;
        src = 'this.truncate(' + strcall() + ',' + a + ',\'' + b + '\')';
        break;
      case 'pad':
        a = util.number(args[0]);
        b = args[1];
        b = (b!=='left' && b!=='middle' && b!=='center') ? 'right' : b;
        src = 'this.pad(' + strcall() + ',' + a + ',\'' + b + '\')';
        break;
      case 'number':
        formatter('number');
        break;
      case 'time':
        formatter('time');
        break;
      case 'time-utc':
        formatter('utc');
        break;
      case 'month':
        src = 'this.month(' + src + ')';
        break;
      case 'month-abbrev':
        src = 'this.month(' + src + ',true)';
        break;
      case 'day':
        src = 'this.day(' + src + ')';
        break;
      case 'day-abbrev':
        src = 'this.day(' + src + ',true)';
        break;
      default:
        throw Error('Unrecognized template filter: ' + f);
    }
  }

  return src;
}

var template_re = /\{\{(.+?)\}\}|$/g,
    filter_re = /(?:"[^"]*"|\'[^\']*\'|[^\|"]+|[^\|\']+)+/g,
    args_re = /(?:"[^"]*"|\'[^\']*\'|[^,"]+|[^,\']+)+/g;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var template_escapes = {
  '\'':     '\'',
  '\\':     '\\',
  '\r':     'r',
  '\n':     'n',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var template_escaper = /\\|'|\r|\n|\u2028|\u2029/g;

function template_escapeChar(match) {
  return '\\' + template_escapes[match];
}

function template_format(pattern, type) {
  var key = type + ':' + pattern;
  if (context.format_map[key] == null) {
    var f = format[type](pattern);
    var i = context.formats.length;
    context.formats.push(f);
    context.format_map[key] = i;
    return i;
  }
  return context.format_map[key];
}

function get_format(pattern, type) {
  return context.formats[template_format(pattern, type)];
}

},{"./format":15,"./util":30}],29:[function(require,module,exports){
var d3_time = require('d3-time');

var tempDate = new Date(),
    baseDate = new Date(0, 0, 1).setFullYear(0), // Jan 1, 0 AD
    utcBaseDate = new Date(Date.UTC(0, 0, 1)).setUTCFullYear(0);

function date(d) {
  return (tempDate.setTime(+d), tempDate);
}

// create a time unit entry
function entry(type, date, unit, step, min, max) {
  var e = {
    type: type,
    date: date,
    unit: unit
  };
  if (step) {
    e.step = step;
  } else {
    e.minstep = 1;
  }
  if (min != null) e.min = min;
  if (max != null) e.max = max;
  return e;
}

function create(type, unit, base, step, min, max) {
  return entry(type,
    function(d) { return unit.offset(base, d); },
    function(d) { return unit.count(base, d); },
    step, min, max);
}

var locale = [
  create('second', d3_time.second, baseDate),
  create('minute', d3_time.minute, baseDate),
  create('hour',   d3_time.hour,   baseDate),
  create('day',    d3_time.day,    baseDate, [1, 7]),
  create('month',  d3_time.month,  baseDate, [1, 3, 6]),
  create('year',   d3_time.year,   baseDate),

  // periodic units
  entry('seconds',
    function(d) { return new Date(1970, 0, 1, 0, 0, d); },
    function(d) { return date(d).getSeconds(); },
    null, 0, 59
  ),
  entry('minutes',
    function(d) { return new Date(1970, 0, 1, 0, d); },
    function(d) { return date(d).getMinutes(); },
    null, 0, 59
  ),
  entry('hours',
    function(d) { return new Date(1970, 0, 1, d); },
    function(d) { return date(d).getHours(); },
    null, 0, 23
  ),
  entry('weekdays',
    function(d) { return new Date(1970, 0, 4+d); },
    function(d) { return date(d).getDay(); },
    [1], 0, 6
  ),
  entry('dates',
    function(d) { return new Date(1970, 0, d); },
    function(d) { return date(d).getDate(); },
    [1], 1, 31
  ),
  entry('months',
    function(d) { return new Date(1970, d % 12, 1); },
    function(d) { return date(d).getMonth(); },
    [1], 0, 11
  )
];

var utc = [
  create('second', d3_time.utcSecond, utcBaseDate),
  create('minute', d3_time.utcMinute, utcBaseDate),
  create('hour',   d3_time.utcHour,   utcBaseDate),
  create('day',    d3_time.utcDay,    utcBaseDate, [1, 7]),
  create('month',  d3_time.utcMonth,  utcBaseDate, [1, 3, 6]),
  create('year',   d3_time.utcYear,   utcBaseDate),

  // periodic units
  entry('seconds',
    function(d) { return new Date(Date.UTC(1970, 0, 1, 0, 0, d)); },
    function(d) { return date(d).getUTCSeconds(); },
    null, 0, 59
  ),
  entry('minutes',
    function(d) { return new Date(Date.UTC(1970, 0, 1, 0, d)); },
    function(d) { return date(d).getUTCMinutes(); },
    null, 0, 59
  ),
  entry('hours',
    function(d) { return new Date(Date.UTC(1970, 0, 1, d)); },
    function(d) { return date(d).getUTCHours(); },
    null, 0, 23
  ),
  entry('weekdays',
    function(d) { return new Date(Date.UTC(1970, 0, 4+d)); },
    function(d) { return date(d).getUTCDay(); },
    [1], 0, 6
  ),
  entry('dates',
    function(d) { return new Date(Date.UTC(1970, 0, d)); },
    function(d) { return date(d).getUTCDate(); },
    [1], 1, 31
  ),
  entry('months',
    function(d) { return new Date(Date.UTC(1970, d % 12, 1)); },
    function(d) { return date(d).getUTCMonth(); },
    [1], 0, 11
  )
];

var STEPS = [
  [31536e6, 5],  // 1-year
  [7776e6, 4],   // 3-month
  [2592e6, 4],   // 1-month
  [12096e5, 3],  // 2-week
  [6048e5, 3],   // 1-week
  [1728e5, 3],   // 2-day
  [864e5, 3],    // 1-day
  [432e5, 2],    // 12-hour
  [216e5, 2],    // 6-hour
  [108e5, 2],    // 3-hour
  [36e5, 2],     // 1-hour
  [18e5, 1],     // 30-minute
  [9e5, 1],      // 15-minute
  [3e5, 1],      // 5-minute
  [6e4, 1],      // 1-minute
  [3e4, 0],      // 30-second
  [15e3, 0],     // 15-second
  [5e3, 0],      // 5-second
  [1e3, 0]       // 1-second
];

function find(units, span, minb, maxb) {
  var step = STEPS[0], i, n, bins;

  for (i=1, n=STEPS.length; i<n; ++i) {
    step = STEPS[i];
    if (span > step[0]) {
      bins = span / step[0];
      if (bins > maxb) {
        return units[STEPS[i-1][1]];
      }
      if (bins >= minb) {
        return units[step[1]];
      }
    }
  }
  return units[STEPS[n-1][1]];
}

function toUnitMap(units) {
  var map = {}, i, n;
  for (i=0, n=units.length; i<n; ++i) {
    map[units[i].type] = units[i];
  }
  map.find = function(span, minb, maxb) {
    return find(units, span, minb, maxb);
  };
  return map;
}

module.exports = toUnitMap(locale);
module.exports.utc = toUnitMap(utc);
},{"d3-time":5}],30:[function(require,module,exports){
(function (Buffer){
var u = module.exports;

// utility functions

var FNAME = '__name__';

u.namedfunc = function(name, f) { return (f[FNAME] = name, f); };

u.name = function(f) { return f==null ? null : f[FNAME]; };

u.identity = function(x) { return x; };

u.true = u.namedfunc('true', function() { return true; });

u.false = u.namedfunc('false', function() { return false; });

u.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

u.equal = function(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
};

u.extend = function(obj) {
  for (var x, name, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (name in x) { obj[name] = x[name]; }
  }
  return obj;
};

u.length = function(x) {
  return x != null && x.length != null ? x.length : null;
};

u.keys = function(x) {
  var keys = [], k;
  for (k in x) keys.push(k);
  return keys;
};

u.vals = function(x) {
  var vals = [], k;
  for (k in x) vals.push(x[k]);
  return vals;
};

u.toMap = function(list, f) {
  return (f = u.$(f)) ?
    list.reduce(function(obj, x) { return (obj[f(x)] = 1, obj); }, {}) :
    list.reduce(function(obj, x) { return (obj[x] = 1, obj); }, {});
};

u.keystr = function(values) {
  // use to ensure consistent key generation across modules
  var n = values.length;
  if (!n) return '';
  for (var s=String(values[0]), i=1; i<n; ++i) {
    s += '|' + String(values[i]);
  }
  return s;
};

// type checking functions

var toString = Object.prototype.toString;

u.isObject = function(obj) {
  return obj === Object(obj);
};

u.isFunction = function(obj) {
  return toString.call(obj) === '[object Function]';
};

u.isString = function(obj) {
  return typeof value === 'string' || toString.call(obj) === '[object String]';
};

u.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

u.isNumber = function(obj) {
  return typeof obj === 'number' || toString.call(obj) === '[object Number]';
};

u.isBoolean = function(obj) {
  return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
};

u.isDate = function(obj) {
  return toString.call(obj) === '[object Date]';
};

u.isValid = function(obj) {
  return obj != null && obj === obj;
};

u.isBuffer = (typeof Buffer === 'function' && Buffer.isBuffer) || u.false;

// type coercion functions

u.number = function(s) {
  return s == null || s === '' ? null : +s;
};

u.boolean = function(s) {
  return s == null || s === '' ? null : s==='false' ? false : !!s;
};

// parse a date with optional d3.time-format format
u.date = function(s, format) {
  var d = format ? format : Date;
  return s == null || s === '' ? null : d.parse(s);
};

u.array = function(x) {
  return x != null ? (u.isArray(x) ? x : [x]) : [];
};

u.str = function(x) {
  return u.isArray(x) ? '[' + x.map(u.str) + ']'
    : u.isObject(x) || u.isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
};

// data access functions

var field_re = /\[(.*?)\]|[^.\[]+/g;

u.field = function(f) {
  return String(f).match(field_re).map(function(d) {
    return d[0] !== '[' ? d :
      d[1] !== "'" && d[1] !== '"' ? d.slice(1, -1) :
      d.slice(2, -2).replace(/\\(["'])/g, '$1');
  });
};

u.accessor = function(f) {
  /* jshint evil: true */
  return f==null || u.isFunction(f) ? f :
    u.namedfunc(f, Function('x', 'return x[' + u.field(f).map(u.str).join('][') + '];'));
};

// short-cut for accessor
u.$ = u.accessor;

u.mutator = function(f) {
  var s;
  return u.isString(f) && (s=u.field(f)).length > 1 ?
    function(x, v) {
      for (var i=0; i<s.length-1; ++i) x = x[s[i]];
      x[s[i]] = v;
    } :
    function(x, v) { x[f] = v; };
};


u.$func = function(name, op) {
  return function(f) {
    f = u.$(f) || u.identity;
    var n = name + (u.name(f) ? '_'+u.name(f) : '');
    return u.namedfunc(n, function(d) { return op(f(d)); });
  };
};

u.$valid  = u.$func('valid', u.isValid);
u.$length = u.$func('length', u.length);

u.$in = function(f, values) {
  f = u.$(f);
  var map = u.isArray(values) ? u.toMap(values) : values;
  return function(d) { return !!map[f(d)]; };
};

// comparison / sorting functions

u.comparator = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = u.array(sort).map(function(f) {
    var s = 1;
    if      (f[0] === '-') { s = -1; f = f.slice(1); }
    else if (f[0] === '+') { s = +1; f = f.slice(1); }
    sign.push(s);
    return u.accessor(f);
  });
  return function(a,b) {
    var i, n, f, x, y;
    for (i=0, n=sort.length; i<n; ++i) {
      f = sort[i]; x = f(a); y = f(b);
      if (x < y) return -1 * sign[i];
      if (x > y) return sign[i];
    }
    return 0;
  };
};

u.cmp = function(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else if (a >= b) {
    return 0;
  } else if (a === null) {
    return -1;
  } else if (b === null) {
    return 1;
  }
  return NaN;
};

u.numcmp = function(a, b) { return a - b; };

u.stablesort = function(array, sortBy, keyFn) {
  var indices = array.reduce(function(idx, v, i) {
    return (idx[keyFn(v)] = i, idx);
  }, {});

  array.sort(function(a, b) {
    var sa = sortBy(a),
        sb = sortBy(b);
    return sa < sb ? -1 : sa > sb ? 1
         : (indices[keyFn(a)] - indices[keyFn(b)]);
  });

  return array;
};


// string functions

u.pad = function(s, length, pos, padchar) {
  padchar = padchar || " ";
  var d = length - s.length;
  if (d <= 0) return s;
  switch (pos) {
    case 'left':
      return strrep(d, padchar) + s;
    case 'middle':
    case 'center':
      return strrep(Math.floor(d/2), padchar) +
         s + strrep(Math.ceil(d/2), padchar);
    default:
      return s + strrep(d, padchar);
  }
};

function strrep(n, str) {
  var s = "", i;
  for (i=0; i<n; ++i) s += str;
  return s;
}

u.truncate = function(s, length, pos, word, ellipsis) {
  var len = s.length;
  if (len <= length) return s;
  ellipsis = ellipsis !== undefined ? String(ellipsis) : '\u2026';
  var l = Math.max(0, length - ellipsis.length);

  switch (pos) {
    case 'left':
      return ellipsis + (word ? truncateOnWord(s,l,1) : s.slice(len-l));
    case 'middle':
    case 'center':
      var l1 = Math.ceil(l/2), l2 = Math.floor(l/2);
      return (word ? truncateOnWord(s,l1) : s.slice(0,l1)) +
        ellipsis + (word ? truncateOnWord(s,l2,1) : s.slice(len-l2));
    default:
      return (word ? truncateOnWord(s,l) : s.slice(0,l)) + ellipsis;
  }
};

function truncateOnWord(s, len, rev) {
  var cnt = 0, tok = s.split(truncate_word_re);
  if (rev) {
    s = (tok = tok.reverse())
      .filter(function(w) { cnt += w.length; return cnt <= len; })
      .reverse();
  } else {
    s = tok.filter(function(w) { cnt += w.length; return cnt <= len; });
  }
  return s.length ? s.join('').trim() : tok[0].slice(0, len);
}

var truncate_word_re = /([\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF])/;

}).call(this,require("buffer").Buffer)

},{"buffer":1}]},{},[26])(26)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2QzLWRzdi9idWlsZC9kMy1kc3YuanMiLCJub2RlX21vZHVsZXMvZDMtZm9ybWF0L2J1aWxkL2QzLWZvcm1hdC5qcyIsIm5vZGVfbW9kdWxlcy9kMy10aW1lLWZvcm1hdC9idWlsZC9kMy10aW1lLWZvcm1hdC5qcyIsIm5vZGVfbW9kdWxlcy9kMy10aW1lL2J1aWxkL2QzLXRpbWUuanMiLCJub2RlX21vZHVsZXMvdG9wb2pzb24vYnVpbGQvdG9wb2pzb24uanMiLCJzcmMvYWNjZXNzb3IuanMiLCJzcmMvYWdncmVnYXRlL2FnZ3JlZ2F0b3IuanMiLCJzcmMvYWdncmVnYXRlL2NvbGxlY3Rvci5qcyIsInNyYy9hZ2dyZWdhdGUvZ3JvdXBieS5qcyIsInNyYy9hZ2dyZWdhdGUvbWVhc3VyZXMuanMiLCJzcmMvYmlucy9iaW5zLmpzIiwic3JjL2JpbnMvaGlzdG9ncmFtLmpzIiwic3JjL2Zvcm1hdC10YWJsZXMuanMiLCJzcmMvZm9ybWF0LmpzIiwic3JjL2dlbmVyYXRlLmpzIiwic3JjL2ltcG9ydC9mb3JtYXRzL2Rzdi5qcyIsInNyYy9pbXBvcnQvZm9ybWF0cy9pbmRleC5qcyIsInNyYy9pbXBvcnQvZm9ybWF0cy9qc29uLmpzIiwic3JjL2ltcG9ydC9mb3JtYXRzL3RvcG9qc29uLmpzIiwic3JjL2ltcG9ydC9mb3JtYXRzL3RyZWVqc29uLmpzIiwic3JjL2ltcG9ydC9sb2FkLmpzIiwic3JjL2ltcG9ydC9yZWFkLmpzIiwic3JjL2ltcG9ydC9yZWFkZXJzLmpzIiwic3JjL2ltcG9ydC90eXBlLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3N0YXRzLmpzIiwic3JjL3RlbXBsYXRlLmpzIiwic3JjL3RpbWUuanMiLCJzcmMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbnpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2h0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKGdsb2JhbC5kM19kc3YgPSB7fSkpKTtcbn0odGhpcywgZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIGZ1bmN0aW9uIGRzdihkZWxpbWl0ZXIpIHtcbiAgICByZXR1cm4gbmV3IERzdihkZWxpbWl0ZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gb2JqZWN0Q29udmVydGVyKGNvbHVtbnMpIHtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwiZFwiLCBcInJldHVybiB7XCIgKyBjb2x1bW5zLm1hcChmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobmFtZSkgKyBcIjogZFtcIiArIGkgKyBcIl1cIjtcbiAgICB9KS5qb2luKFwiLFwiKSArIFwifVwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN1c3RvbUNvbnZlcnRlcihjb2x1bW5zLCBmKSB7XG4gICAgdmFyIG9iamVjdCA9IG9iamVjdENvbnZlcnRlcihjb2x1bW5zKTtcbiAgICByZXR1cm4gZnVuY3Rpb24ocm93LCBpKSB7XG4gICAgICByZXR1cm4gZihvYmplY3Qocm93KSwgaSwgY29sdW1ucyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIENvbXB1dGUgdW5pcXVlIGNvbHVtbnMgaW4gb3JkZXIgb2YgZGlzY292ZXJ5LlxuICBmdW5jdGlvbiBpbmZlckNvbHVtbnMocm93cykge1xuICAgIHZhciBjb2x1bW5TZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpLFxuICAgICAgICBjb2x1bW5zID0gW107XG5cbiAgICByb3dzLmZvckVhY2goZnVuY3Rpb24ocm93KSB7XG4gICAgICBmb3IgKHZhciBjb2x1bW4gaW4gcm93KSB7XG4gICAgICAgIGlmICghKGNvbHVtbiBpbiBjb2x1bW5TZXQpKSB7XG4gICAgICAgICAgY29sdW1ucy5wdXNoKGNvbHVtblNldFtjb2x1bW5dID0gY29sdW1uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbHVtbnM7XG4gIH1cblxuICBmdW5jdGlvbiBEc3YoZGVsaW1pdGVyKSB7XG4gICAgdmFyIHJlRm9ybWF0ID0gbmV3IFJlZ0V4cChcIltcXFwiXCIgKyBkZWxpbWl0ZXIgKyBcIlxcbl1cIiksXG4gICAgICAgIGRlbGltaXRlckNvZGUgPSBkZWxpbWl0ZXIuY2hhckNvZGVBdCgwKTtcblxuICAgIHRoaXMucGFyc2UgPSBmdW5jdGlvbih0ZXh0LCBmKSB7XG4gICAgICB2YXIgY29udmVydCwgY29sdW1ucywgcm93cyA9IHRoaXMucGFyc2VSb3dzKHRleHQsIGZ1bmN0aW9uKHJvdywgaSkge1xuICAgICAgICBpZiAoY29udmVydCkgcmV0dXJuIGNvbnZlcnQocm93LCBpIC0gMSk7XG4gICAgICAgIGNvbHVtbnMgPSByb3csIGNvbnZlcnQgPSBmID8gY3VzdG9tQ29udmVydGVyKHJvdywgZikgOiBvYmplY3RDb252ZXJ0ZXIocm93KTtcbiAgICAgIH0pO1xuICAgICAgcm93cy5jb2x1bW5zID0gY29sdW1ucztcbiAgICAgIHJldHVybiByb3dzO1xuICAgIH07XG5cbiAgICB0aGlzLnBhcnNlUm93cyA9IGZ1bmN0aW9uKHRleHQsIGYpIHtcbiAgICAgIHZhciBFT0wgPSB7fSwgLy8gc2VudGluZWwgdmFsdWUgZm9yIGVuZC1vZi1saW5lXG4gICAgICAgICAgRU9GID0ge30sIC8vIHNlbnRpbmVsIHZhbHVlIGZvciBlbmQtb2YtZmlsZVxuICAgICAgICAgIHJvd3MgPSBbXSwgLy8gb3V0cHV0IHJvd3NcbiAgICAgICAgICBOID0gdGV4dC5sZW5ndGgsXG4gICAgICAgICAgSSA9IDAsIC8vIGN1cnJlbnQgY2hhcmFjdGVyIGluZGV4XG4gICAgICAgICAgbiA9IDAsIC8vIHRoZSBjdXJyZW50IGxpbmUgbnVtYmVyXG4gICAgICAgICAgdCwgLy8gdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICBlb2w7IC8vIGlzIHRoZSBjdXJyZW50IHRva2VuIGZvbGxvd2VkIGJ5IEVPTD9cblxuICAgICAgZnVuY3Rpb24gdG9rZW4oKSB7XG4gICAgICAgIGlmIChJID49IE4pIHJldHVybiBFT0Y7IC8vIHNwZWNpYWwgY2FzZTogZW5kIG9mIGZpbGVcbiAgICAgICAgaWYgKGVvbCkgcmV0dXJuIGVvbCA9IGZhbHNlLCBFT0w7IC8vIHNwZWNpYWwgY2FzZTogZW5kIG9mIGxpbmVcblxuICAgICAgICAvLyBzcGVjaWFsIGNhc2U6IHF1b3Rlc1xuICAgICAgICB2YXIgaiA9IEksIGM7XG4gICAgICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaikgPT09IDM0KSB7XG4gICAgICAgICAgdmFyIGkgPSBqO1xuICAgICAgICAgIHdoaWxlIChpKysgPCBOKSB7XG4gICAgICAgICAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkpID09PSAzNCkge1xuICAgICAgICAgICAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkgKyAxKSAhPT0gMzQpIGJyZWFrO1xuICAgICAgICAgICAgICArK2k7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIEkgPSBpICsgMjtcbiAgICAgICAgICBjID0gdGV4dC5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgICBpZiAoYyA9PT0gMTMpIHtcbiAgICAgICAgICAgIGVvbCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkgKyAyKSA9PT0gMTApICsrSTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGMgPT09IDEwKSB7XG4gICAgICAgICAgICBlb2wgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGV4dC5zbGljZShqICsgMSwgaSkucmVwbGFjZSgvXCJcIi9nLCBcIlxcXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb21tb24gY2FzZTogZmluZCBuZXh0IGRlbGltaXRlciBvciBuZXdsaW5lXG4gICAgICAgIHdoaWxlIChJIDwgTikge1xuICAgICAgICAgIHZhciBrID0gMTtcbiAgICAgICAgICBjID0gdGV4dC5jaGFyQ29kZUF0KEkrKyk7XG4gICAgICAgICAgaWYgKGMgPT09IDEwKSBlb2wgPSB0cnVlOyAvLyBcXG5cbiAgICAgICAgICBlbHNlIGlmIChjID09PSAxMykgeyBlb2wgPSB0cnVlOyBpZiAodGV4dC5jaGFyQ29kZUF0KEkpID09PSAxMCkgKytJLCArK2s7IH0gLy8gXFxyfFxcclxcblxuICAgICAgICAgIGVsc2UgaWYgKGMgIT09IGRlbGltaXRlckNvZGUpIGNvbnRpbnVlO1xuICAgICAgICAgIHJldHVybiB0ZXh0LnNsaWNlKGosIEkgLSBrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNwZWNpYWwgY2FzZTogbGFzdCB0b2tlbiBiZWZvcmUgRU9GXG4gICAgICAgIHJldHVybiB0ZXh0LnNsaWNlKGopO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAoKHQgPSB0b2tlbigpKSAhPT0gRU9GKSB7XG4gICAgICAgIHZhciBhID0gW107XG4gICAgICAgIHdoaWxlICh0ICE9PSBFT0wgJiYgdCAhPT0gRU9GKSB7XG4gICAgICAgICAgYS5wdXNoKHQpO1xuICAgICAgICAgIHQgPSB0b2tlbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmICYmIChhID0gZihhLCBuKyspKSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgICAgcm93cy5wdXNoKGEpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcm93cztcbiAgICB9XG5cbiAgICB0aGlzLmZvcm1hdCA9IGZ1bmN0aW9uKHJvd3MsIGNvbHVtbnMpIHtcbiAgICAgIGlmIChjb2x1bW5zID09IG51bGwpIGNvbHVtbnMgPSBpbmZlckNvbHVtbnMocm93cyk7XG4gICAgICByZXR1cm4gW2NvbHVtbnMubWFwKGZvcm1hdFZhbHVlKS5qb2luKGRlbGltaXRlcildLmNvbmNhdChyb3dzLm1hcChmdW5jdGlvbihyb3cpIHtcbiAgICAgICAgcmV0dXJuIGNvbHVtbnMubWFwKGZ1bmN0aW9uKGNvbHVtbikge1xuICAgICAgICAgIHJldHVybiBmb3JtYXRWYWx1ZShyb3dbY29sdW1uXSk7XG4gICAgICAgIH0pLmpvaW4oZGVsaW1pdGVyKTtcbiAgICAgIH0pKS5qb2luKFwiXFxuXCIpO1xuICAgIH07XG5cbiAgICB0aGlzLmZvcm1hdFJvd3MgPSBmdW5jdGlvbihyb3dzKSB7XG4gICAgICByZXR1cm4gcm93cy5tYXAoZm9ybWF0Um93KS5qb2luKFwiXFxuXCIpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRSb3cocm93KSB7XG4gICAgICByZXR1cm4gcm93Lm1hcChmb3JtYXRWYWx1ZSkuam9pbihkZWxpbWl0ZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHRleHQpIHtcbiAgICAgIHJldHVybiByZUZvcm1hdC50ZXN0KHRleHQpID8gXCJcXFwiXCIgKyB0ZXh0LnJlcGxhY2UoL1xcXCIvZywgXCJcXFwiXFxcIlwiKSArIFwiXFxcIlwiIDogdGV4dDtcbiAgICB9XG4gIH1cblxuICBkc3YucHJvdG90eXBlID0gRHN2LnByb3RvdHlwZTtcblxuICB2YXIgY3N2ID0gZHN2KFwiLFwiKTtcbiAgdmFyIHRzdiA9IGRzdihcIlxcdFwiKTtcblxuICB2YXIgdmVyc2lvbiA9IFwiMC4xLjE0XCI7XG5cbiAgZXhwb3J0cy52ZXJzaW9uID0gdmVyc2lvbjtcbiAgZXhwb3J0cy5kc3YgPSBkc3Y7XG4gIGV4cG9ydHMuY3N2ID0gY3N2O1xuICBleHBvcnRzLnRzdiA9IHRzdjtcblxufSkpOyIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoJ2QzLWZvcm1hdCcsIFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gIGZhY3RvcnkoKGdsb2JhbC5kM19mb3JtYXQgPSB7fSkpO1xufSh0aGlzLCBmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbiAgLy8gQ29tcHV0ZXMgdGhlIGRlY2ltYWwgY29lZmZpY2llbnQgYW5kIGV4cG9uZW50IG9mIHRoZSBzcGVjaWZpZWQgbnVtYmVyIHggd2l0aFxuICAvLyBzaWduaWZpY2FudCBkaWdpdHMgcCwgd2hlcmUgeCBpcyBwb3NpdGl2ZSBhbmQgcCBpcyBpbiBbMSwgMjFdIG9yIHVuZGVmaW5lZC5cbiAgLy8gRm9yIGV4YW1wbGUsIGZvcm1hdERlY2ltYWwoMS4yMykgcmV0dXJucyBbXCIxMjNcIiwgMF0uXG4gIGZ1bmN0aW9uIGZvcm1hdERlY2ltYWwoeCwgcCkge1xuICAgIGlmICgoaSA9ICh4ID0gcCA/IHgudG9FeHBvbmVudGlhbChwIC0gMSkgOiB4LnRvRXhwb25lbnRpYWwoKSkuaW5kZXhPZihcImVcIikpIDwgMCkgcmV0dXJuIG51bGw7IC8vIE5hTiwgwrFJbmZpbml0eVxuICAgIHZhciBpLCBjb2VmZmljaWVudCA9IHguc2xpY2UoMCwgaSk7XG5cbiAgICAvLyBUaGUgc3RyaW5nIHJldHVybmVkIGJ5IHRvRXhwb25lbnRpYWwgZWl0aGVyIGhhcyB0aGUgZm9ybSBcXGRcXC5cXGQrZVstK11cXGQrXG4gICAgLy8gKGUuZy4sIDEuMmUrMykgb3IgdGhlIGZvcm0gXFxkZVstK11cXGQrIChlLmcuLCAxZSszKS5cbiAgICByZXR1cm4gW1xuICAgICAgY29lZmZpY2llbnQubGVuZ3RoID4gMSA/IGNvZWZmaWNpZW50WzBdICsgY29lZmZpY2llbnQuc2xpY2UoMikgOiBjb2VmZmljaWVudCxcbiAgICAgICt4LnNsaWNlKGkgKyAxKVxuICAgIF07XG4gIH07XG5cbiAgZnVuY3Rpb24gZXhwb25lbnQoeCkge1xuICAgIHJldHVybiB4ID0gZm9ybWF0RGVjaW1hbChNYXRoLmFicyh4KSksIHggPyB4WzFdIDogTmFOO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGZvcm1hdEdyb3VwKGdyb3VwaW5nLCB0aG91c2FuZHMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIHdpZHRoKSB7XG4gICAgICB2YXIgaSA9IHZhbHVlLmxlbmd0aCxcbiAgICAgICAgICB0ID0gW10sXG4gICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgZyA9IGdyb3VwaW5nWzBdLFxuICAgICAgICAgIGxlbmd0aCA9IDA7XG5cbiAgICAgIHdoaWxlIChpID4gMCAmJiBnID4gMCkge1xuICAgICAgICBpZiAobGVuZ3RoICsgZyArIDEgPiB3aWR0aCkgZyA9IE1hdGgubWF4KDEsIHdpZHRoIC0gbGVuZ3RoKTtcbiAgICAgICAgdC5wdXNoKHZhbHVlLnN1YnN0cmluZyhpIC09IGcsIGkgKyBnKSk7XG4gICAgICAgIGlmICgobGVuZ3RoICs9IGcgKyAxKSA+IHdpZHRoKSBicmVhaztcbiAgICAgICAgZyA9IGdyb3VwaW5nW2ogPSAoaiArIDEpICUgZ3JvdXBpbmcubGVuZ3RoXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHQucmV2ZXJzZSgpLmpvaW4odGhvdXNhbmRzKTtcbiAgICB9O1xuICB9O1xuXG4gIHZhciBwcmVmaXhFeHBvbmVudDtcblxuICBmdW5jdGlvbiBmb3JtYXRQcmVmaXhBdXRvKHgsIHApIHtcbiAgICB2YXIgZCA9IGZvcm1hdERlY2ltYWwoeCwgcCk7XG4gICAgaWYgKCFkKSByZXR1cm4geCArIFwiXCI7XG4gICAgdmFyIGNvZWZmaWNpZW50ID0gZFswXSxcbiAgICAgICAgZXhwb25lbnQgPSBkWzFdLFxuICAgICAgICBpID0gZXhwb25lbnQgLSAocHJlZml4RXhwb25lbnQgPSBNYXRoLm1heCgtOCwgTWF0aC5taW4oOCwgTWF0aC5mbG9vcihleHBvbmVudCAvIDMpKSkgKiAzKSArIDEsXG4gICAgICAgIG4gPSBjb2VmZmljaWVudC5sZW5ndGg7XG4gICAgcmV0dXJuIGkgPT09IG4gPyBjb2VmZmljaWVudFxuICAgICAgICA6IGkgPiBuID8gY29lZmZpY2llbnQgKyBuZXcgQXJyYXkoaSAtIG4gKyAxKS5qb2luKFwiMFwiKVxuICAgICAgICA6IGkgPiAwID8gY29lZmZpY2llbnQuc2xpY2UoMCwgaSkgKyBcIi5cIiArIGNvZWZmaWNpZW50LnNsaWNlKGkpXG4gICAgICAgIDogXCIwLlwiICsgbmV3IEFycmF5KDEgLSBpKS5qb2luKFwiMFwiKSArIGZvcm1hdERlY2ltYWwoeCwgTWF0aC5tYXgoMCwgcCArIGkgLSAxKSlbMF07IC8vIGxlc3MgdGhhbiAxeSFcbiAgfTtcblxuICBmdW5jdGlvbiBmb3JtYXRSb3VuZGVkKHgsIHApIHtcbiAgICB2YXIgZCA9IGZvcm1hdERlY2ltYWwoeCwgcCk7XG4gICAgaWYgKCFkKSByZXR1cm4geCArIFwiXCI7XG4gICAgdmFyIGNvZWZmaWNpZW50ID0gZFswXSxcbiAgICAgICAgZXhwb25lbnQgPSBkWzFdO1xuICAgIHJldHVybiBleHBvbmVudCA8IDAgPyBcIjAuXCIgKyBuZXcgQXJyYXkoLWV4cG9uZW50KS5qb2luKFwiMFwiKSArIGNvZWZmaWNpZW50XG4gICAgICAgIDogY29lZmZpY2llbnQubGVuZ3RoID4gZXhwb25lbnQgKyAxID8gY29lZmZpY2llbnQuc2xpY2UoMCwgZXhwb25lbnQgKyAxKSArIFwiLlwiICsgY29lZmZpY2llbnQuc2xpY2UoZXhwb25lbnQgKyAxKVxuICAgICAgICA6IGNvZWZmaWNpZW50ICsgbmV3IEFycmF5KGV4cG9uZW50IC0gY29lZmZpY2llbnQubGVuZ3RoICsgMikuam9pbihcIjBcIik7XG4gIH07XG5cbiAgZnVuY3Rpb24gZm9ybWF0RGVmYXVsdCh4LCBwKSB7XG4gICAgeCA9IHgudG9QcmVjaXNpb24ocCk7XG5cbiAgICBvdXQ6IGZvciAodmFyIG4gPSB4Lmxlbmd0aCwgaSA9IDEsIGkwID0gLTEsIGkxOyBpIDwgbjsgKytpKSB7XG4gICAgICBzd2l0Y2ggKHhbaV0pIHtcbiAgICAgICAgY2FzZSBcIi5cIjogaTAgPSBpMSA9IGk7IGJyZWFrO1xuICAgICAgICBjYXNlIFwiMFwiOiBpZiAoaTAgPT09IDApIGkwID0gaTsgaTEgPSBpOyBicmVhaztcbiAgICAgICAgY2FzZSBcImVcIjogYnJlYWsgb3V0O1xuICAgICAgICBkZWZhdWx0OiBpZiAoaTAgPiAwKSBpMCA9IDA7IGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpMCA+IDAgPyB4LnNsaWNlKDAsIGkwKSArIHguc2xpY2UoaTEgKyAxKSA6IHg7XG4gIH07XG5cbiAgdmFyIGZvcm1hdFR5cGVzID0ge1xuICAgIFwiXCI6IGZvcm1hdERlZmF1bHQsXG4gICAgXCIlXCI6IGZ1bmN0aW9uKHgsIHApIHsgcmV0dXJuICh4ICogMTAwKS50b0ZpeGVkKHApOyB9LFxuICAgIFwiYlwiOiBmdW5jdGlvbih4KSB7IHJldHVybiBNYXRoLnJvdW5kKHgpLnRvU3RyaW5nKDIpOyB9LFxuICAgIFwiY1wiOiBmdW5jdGlvbih4KSB7IHJldHVybiB4ICsgXCJcIjsgfSxcbiAgICBcImRcIjogZnVuY3Rpb24oeCkgeyByZXR1cm4gTWF0aC5yb3VuZCh4KS50b1N0cmluZygxMCk7IH0sXG4gICAgXCJlXCI6IGZ1bmN0aW9uKHgsIHApIHsgcmV0dXJuIHgudG9FeHBvbmVudGlhbChwKTsgfSxcbiAgICBcImZcIjogZnVuY3Rpb24oeCwgcCkgeyByZXR1cm4geC50b0ZpeGVkKHApOyB9LFxuICAgIFwiZ1wiOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiB4LnRvUHJlY2lzaW9uKHApOyB9LFxuICAgIFwib1wiOiBmdW5jdGlvbih4KSB7IHJldHVybiBNYXRoLnJvdW5kKHgpLnRvU3RyaW5nKDgpOyB9LFxuICAgIFwicFwiOiBmdW5jdGlvbih4LCBwKSB7IHJldHVybiBmb3JtYXRSb3VuZGVkKHggKiAxMDAsIHApOyB9LFxuICAgIFwiclwiOiBmb3JtYXRSb3VuZGVkLFxuICAgIFwic1wiOiBmb3JtYXRQcmVmaXhBdXRvLFxuICAgIFwiWFwiOiBmdW5jdGlvbih4KSB7IHJldHVybiBNYXRoLnJvdW5kKHgpLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpOyB9LFxuICAgIFwieFwiOiBmdW5jdGlvbih4KSB7IHJldHVybiBNYXRoLnJvdW5kKHgpLnRvU3RyaW5nKDE2KTsgfVxuICB9O1xuXG4gIC8vIFtbZmlsbF1hbGlnbl1bc2lnbl1bc3ltYm9sXVswXVt3aWR0aF1bLF1bLnByZWNpc2lvbl1bdHlwZV1cbiAgdmFyIHJlID0gL14oPzooLik/KFs8Pj1eXSkpPyhbK1xcLVxcKCBdKT8oWyQjXSk/KDApPyhcXGQrKT8oLCk/KFxcLlxcZCspPyhbYS16JV0pPyQvaTtcblxuICBmdW5jdGlvbiBmb3JtYXRTcGVjaWZpZXIoc3BlY2lmaWVyKSB7XG4gICAgcmV0dXJuIG5ldyBGb3JtYXRTcGVjaWZpZXIoc3BlY2lmaWVyKTtcbiAgfTtcblxuICBmdW5jdGlvbiBGb3JtYXRTcGVjaWZpZXIoc3BlY2lmaWVyKSB7XG4gICAgaWYgKCEobWF0Y2ggPSByZS5leGVjKHNwZWNpZmllcikpKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGZvcm1hdDogXCIgKyBzcGVjaWZpZXIpO1xuXG4gICAgdmFyIG1hdGNoLFxuICAgICAgICBmaWxsID0gbWF0Y2hbMV0gfHwgXCIgXCIsXG4gICAgICAgIGFsaWduID0gbWF0Y2hbMl0gfHwgXCI+XCIsXG4gICAgICAgIHNpZ24gPSBtYXRjaFszXSB8fCBcIi1cIixcbiAgICAgICAgc3ltYm9sID0gbWF0Y2hbNF0gfHwgXCJcIixcbiAgICAgICAgemVybyA9ICEhbWF0Y2hbNV0sXG4gICAgICAgIHdpZHRoID0gbWF0Y2hbNl0gJiYgK21hdGNoWzZdLFxuICAgICAgICBjb21tYSA9ICEhbWF0Y2hbN10sXG4gICAgICAgIHByZWNpc2lvbiA9IG1hdGNoWzhdICYmICttYXRjaFs4XS5zbGljZSgxKSxcbiAgICAgICAgdHlwZSA9IG1hdGNoWzldIHx8IFwiXCI7XG5cbiAgICAvLyBUaGUgXCJuXCIgdHlwZSBpcyBhbiBhbGlhcyBmb3IgXCIsZ1wiLlxuICAgIGlmICh0eXBlID09PSBcIm5cIikgY29tbWEgPSB0cnVlLCB0eXBlID0gXCJnXCI7XG5cbiAgICAvLyBNYXAgaW52YWxpZCB0eXBlcyB0byB0aGUgZGVmYXVsdCBmb3JtYXQuXG4gICAgZWxzZSBpZiAoIWZvcm1hdFR5cGVzW3R5cGVdKSB0eXBlID0gXCJcIjtcblxuICAgIC8vIElmIHplcm8gZmlsbCBpcyBzcGVjaWZpZWQsIHBhZGRpbmcgZ29lcyBhZnRlciBzaWduIGFuZCBiZWZvcmUgZGlnaXRzLlxuICAgIGlmICh6ZXJvIHx8IChmaWxsID09PSBcIjBcIiAmJiBhbGlnbiA9PT0gXCI9XCIpKSB6ZXJvID0gdHJ1ZSwgZmlsbCA9IFwiMFwiLCBhbGlnbiA9IFwiPVwiO1xuXG4gICAgdGhpcy5maWxsID0gZmlsbDtcbiAgICB0aGlzLmFsaWduID0gYWxpZ247XG4gICAgdGhpcy5zaWduID0gc2lnbjtcbiAgICB0aGlzLnN5bWJvbCA9IHN5bWJvbDtcbiAgICB0aGlzLnplcm8gPSB6ZXJvO1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmNvbW1hID0gY29tbWE7XG4gICAgdGhpcy5wcmVjaXNpb24gPSBwcmVjaXNpb247XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgfVxuXG4gIEZvcm1hdFNwZWNpZmllci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5maWxsXG4gICAgICAgICsgdGhpcy5hbGlnblxuICAgICAgICArIHRoaXMuc2lnblxuICAgICAgICArIHRoaXMuc3ltYm9sXG4gICAgICAgICsgKHRoaXMuemVybyA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgKyAodGhpcy53aWR0aCA9PSBudWxsID8gXCJcIiA6IE1hdGgubWF4KDEsIHRoaXMud2lkdGggfCAwKSlcbiAgICAgICAgKyAodGhpcy5jb21tYSA/IFwiLFwiIDogXCJcIilcbiAgICAgICAgKyAodGhpcy5wcmVjaXNpb24gPT0gbnVsbCA/IFwiXCIgOiBcIi5cIiArIE1hdGgubWF4KDAsIHRoaXMucHJlY2lzaW9uIHwgMCkpXG4gICAgICAgICsgdGhpcy50eXBlO1xuICB9O1xuXG4gIHZhciBwcmVmaXhlcyA9IFtcInlcIixcInpcIixcImFcIixcImZcIixcInBcIixcIm5cIixcIsK1XCIsXCJtXCIsXCJcIixcImtcIixcIk1cIixcIkdcIixcIlRcIixcIlBcIixcIkVcIixcIlpcIixcIllcIl07XG5cbiAgZnVuY3Rpb24gaWRlbnRpdHkoeCkge1xuICAgIHJldHVybiB4O1xuICB9XG5cbiAgZnVuY3Rpb24gbG9jYWxlKGxvY2FsZSkge1xuICAgIHZhciBncm91cCA9IGxvY2FsZS5ncm91cGluZyAmJiBsb2NhbGUudGhvdXNhbmRzID8gZm9ybWF0R3JvdXAobG9jYWxlLmdyb3VwaW5nLCBsb2NhbGUudGhvdXNhbmRzKSA6IGlkZW50aXR5LFxuICAgICAgICBjdXJyZW5jeSA9IGxvY2FsZS5jdXJyZW5jeSxcbiAgICAgICAgZGVjaW1hbCA9IGxvY2FsZS5kZWNpbWFsO1xuXG4gICAgZnVuY3Rpb24gZm9ybWF0KHNwZWNpZmllcikge1xuICAgICAgc3BlY2lmaWVyID0gZm9ybWF0U3BlY2lmaWVyKHNwZWNpZmllcik7XG5cbiAgICAgIHZhciBmaWxsID0gc3BlY2lmaWVyLmZpbGwsXG4gICAgICAgICAgYWxpZ24gPSBzcGVjaWZpZXIuYWxpZ24sXG4gICAgICAgICAgc2lnbiA9IHNwZWNpZmllci5zaWduLFxuICAgICAgICAgIHN5bWJvbCA9IHNwZWNpZmllci5zeW1ib2wsXG4gICAgICAgICAgemVybyA9IHNwZWNpZmllci56ZXJvLFxuICAgICAgICAgIHdpZHRoID0gc3BlY2lmaWVyLndpZHRoLFxuICAgICAgICAgIGNvbW1hID0gc3BlY2lmaWVyLmNvbW1hLFxuICAgICAgICAgIHByZWNpc2lvbiA9IHNwZWNpZmllci5wcmVjaXNpb24sXG4gICAgICAgICAgdHlwZSA9IHNwZWNpZmllci50eXBlO1xuXG4gICAgICAvLyBDb21wdXRlIHRoZSBwcmVmaXggYW5kIHN1ZmZpeC5cbiAgICAgIC8vIEZvciBTSS1wcmVmaXgsIHRoZSBzdWZmaXggaXMgbGF6aWx5IGNvbXB1dGVkLlxuICAgICAgdmFyIHByZWZpeCA9IHN5bWJvbCA9PT0gXCIkXCIgPyBjdXJyZW5jeVswXSA6IHN5bWJvbCA9PT0gXCIjXCIgJiYgL1tib3hYXS8udGVzdCh0eXBlKSA/IFwiMFwiICsgdHlwZS50b0xvd2VyQ2FzZSgpIDogXCJcIixcbiAgICAgICAgICBzdWZmaXggPSBzeW1ib2wgPT09IFwiJFwiID8gY3VycmVuY3lbMV0gOiAvWyVwXS8udGVzdCh0eXBlKSA/IFwiJVwiIDogXCJcIjtcblxuICAgICAgLy8gV2hhdCBmb3JtYXQgZnVuY3Rpb24gc2hvdWxkIHdlIHVzZT9cbiAgICAgIC8vIElzIHRoaXMgYW4gaW50ZWdlciB0eXBlP1xuICAgICAgLy8gQ2FuIHRoaXMgdHlwZSBnZW5lcmF0ZSBleHBvbmVudGlhbCBub3RhdGlvbj9cbiAgICAgIHZhciBmb3JtYXRUeXBlID0gZm9ybWF0VHlwZXNbdHlwZV0sXG4gICAgICAgICAgbWF5YmVTdWZmaXggPSAhdHlwZSB8fCAvW2RlZmdwcnMlXS8udGVzdCh0eXBlKTtcblxuICAgICAgLy8gU2V0IHRoZSBkZWZhdWx0IHByZWNpc2lvbiBpZiBub3Qgc3BlY2lmaWVkLFxuICAgICAgLy8gb3IgY2xhbXAgdGhlIHNwZWNpZmllZCBwcmVjaXNpb24gdG8gdGhlIHN1cHBvcnRlZCByYW5nZS5cbiAgICAgIC8vIEZvciBzaWduaWZpY2FudCBwcmVjaXNpb24sIGl0IG11c3QgYmUgaW4gWzEsIDIxXS5cbiAgICAgIC8vIEZvciBmaXhlZCBwcmVjaXNpb24sIGl0IG11c3QgYmUgaW4gWzAsIDIwXS5cbiAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbiA9PSBudWxsID8gKHR5cGUgPyA2IDogMTIpXG4gICAgICAgICAgOiAvW2dwcnNdLy50ZXN0KHR5cGUpID8gTWF0aC5tYXgoMSwgTWF0aC5taW4oMjEsIHByZWNpc2lvbikpXG4gICAgICAgICAgOiBNYXRoLm1heCgwLCBNYXRoLm1pbigyMCwgcHJlY2lzaW9uKSk7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YXIgdmFsdWVQcmVmaXggPSBwcmVmaXgsXG4gICAgICAgICAgICB2YWx1ZVN1ZmZpeCA9IHN1ZmZpeDtcblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJjXCIpIHtcbiAgICAgICAgICB2YWx1ZVN1ZmZpeCA9IGZvcm1hdFR5cGUodmFsdWUpICsgdmFsdWVTdWZmaXg7XG4gICAgICAgICAgdmFsdWUgPSBcIlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gK3ZhbHVlO1xuXG4gICAgICAgICAgLy8gQ29udmVydCBuZWdhdGl2ZSB0byBwb3NpdGl2ZSwgYW5kIGNvbXB1dGUgdGhlIHByZWZpeC5cbiAgICAgICAgICAvLyBOb3RlIHRoYXQgLTAgaXMgbm90IGxlc3MgdGhhbiAwLCBidXQgMSAvIC0wIGlzIVxuICAgICAgICAgIHZhciB2YWx1ZU5lZ2F0aXZlID0gKHZhbHVlIDwgMCB8fCAxIC8gdmFsdWUgPCAwKSAmJiAodmFsdWUgKj0gLTEsIHRydWUpO1xuXG4gICAgICAgICAgLy8gUGVyZm9ybSB0aGUgaW5pdGlhbCBmb3JtYXR0aW5nLlxuICAgICAgICAgIHZhbHVlID0gZm9ybWF0VHlwZSh2YWx1ZSwgcHJlY2lzaW9uKTtcblxuICAgICAgICAgIC8vIElmIHRoZSBvcmlnaW5hbCB2YWx1ZSB3YXMgbmVnYXRpdmUsIGl0IG1heSBiZSByb3VuZGVkIHRvIHplcm8gZHVyaW5nXG4gICAgICAgICAgLy8gZm9ybWF0dGluZzsgdHJlYXQgdGhpcyBhcyAocG9zaXRpdmUpIHplcm8uXG4gICAgICAgICAgaWYgKHZhbHVlTmVnYXRpdmUpIHtcbiAgICAgICAgICAgIHZhciBpID0gLTEsIG4gPSB2YWx1ZS5sZW5ndGgsIGM7XG4gICAgICAgICAgICB2YWx1ZU5lZ2F0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgICAgICAgICBpZiAoYyA9IHZhbHVlLmNoYXJDb2RlQXQoaSksICg0OCA8IGMgJiYgYyA8IDU4KVxuICAgICAgICAgICAgICAgICAgfHwgKHR5cGUgPT09IFwieFwiICYmIDk2IDwgYyAmJiBjIDwgMTAzKVxuICAgICAgICAgICAgICAgICAgfHwgKHR5cGUgPT09IFwiWFwiICYmIDY0IDwgYyAmJiBjIDwgNzEpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVOZWdhdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb21wdXRlIHRoZSBwcmVmaXggYW5kIHN1ZmZpeC5cbiAgICAgICAgICB2YWx1ZVByZWZpeCA9ICh2YWx1ZU5lZ2F0aXZlID8gKHNpZ24gPT09IFwiKFwiID8gc2lnbiA6IFwiLVwiKSA6IHNpZ24gPT09IFwiLVwiIHx8IHNpZ24gPT09IFwiKFwiID8gXCJcIiA6IHNpZ24pICsgdmFsdWVQcmVmaXg7XG4gICAgICAgICAgdmFsdWVTdWZmaXggPSB2YWx1ZVN1ZmZpeCArICh0eXBlID09PSBcInNcIiA/IHByZWZpeGVzWzggKyBwcmVmaXhFeHBvbmVudCAvIDNdIDogXCJcIikgKyAodmFsdWVOZWdhdGl2ZSAmJiBzaWduID09PSBcIihcIiA/IFwiKVwiIDogXCJcIik7XG5cbiAgICAgICAgICAvLyBCcmVhayB0aGUgZm9ybWF0dGVkIHZhbHVlIGludG8gdGhlIGludGVnZXIg4oCcdmFsdWXigJ0gcGFydCB0aGF0IGNhbiBiZVxuICAgICAgICAgIC8vIGdyb3VwZWQsIGFuZCBmcmFjdGlvbmFsIG9yIGV4cG9uZW50aWFsIOKAnHN1ZmZpeOKAnSBwYXJ0IHRoYXQgaXMgbm90LlxuICAgICAgICAgIGlmIChtYXliZVN1ZmZpeCkge1xuICAgICAgICAgICAgdmFyIGkgPSAtMSwgbiA9IHZhbHVlLmxlbmd0aCwgYztcbiAgICAgICAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgICAgICAgIGlmIChjID0gdmFsdWUuY2hhckNvZGVBdChpKSwgNDggPiBjIHx8IGMgPiA1Nykge1xuICAgICAgICAgICAgICAgIHZhbHVlU3VmZml4ID0gKGMgPT09IDQ2ID8gZGVjaW1hbCArIHZhbHVlLnNsaWNlKGkgKyAxKSA6IHZhbHVlLnNsaWNlKGkpKSArIHZhbHVlU3VmZml4O1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgZmlsbCBjaGFyYWN0ZXIgaXMgbm90IFwiMFwiLCBncm91cGluZyBpcyBhcHBsaWVkIGJlZm9yZSBwYWRkaW5nLlxuICAgICAgICBpZiAoY29tbWEgJiYgIXplcm8pIHZhbHVlID0gZ3JvdXAodmFsdWUsIEluZmluaXR5KTtcblxuICAgICAgICAvLyBDb21wdXRlIHRoZSBwYWRkaW5nLlxuICAgICAgICB2YXIgbGVuZ3RoID0gdmFsdWVQcmVmaXgubGVuZ3RoICsgdmFsdWUubGVuZ3RoICsgdmFsdWVTdWZmaXgubGVuZ3RoLFxuICAgICAgICAgICAgcGFkZGluZyA9IGxlbmd0aCA8IHdpZHRoID8gbmV3IEFycmF5KHdpZHRoIC0gbGVuZ3RoICsgMSkuam9pbihmaWxsKSA6IFwiXCI7XG5cbiAgICAgICAgLy8gSWYgdGhlIGZpbGwgY2hhcmFjdGVyIGlzIFwiMFwiLCBncm91cGluZyBpcyBhcHBsaWVkIGFmdGVyIHBhZGRpbmcuXG4gICAgICAgIGlmIChjb21tYSAmJiB6ZXJvKSB2YWx1ZSA9IGdyb3VwKHBhZGRpbmcgKyB2YWx1ZSwgcGFkZGluZy5sZW5ndGggPyB3aWR0aCAtIHZhbHVlU3VmZml4Lmxlbmd0aCA6IEluZmluaXR5KSwgcGFkZGluZyA9IFwiXCI7XG5cbiAgICAgICAgLy8gUmVjb25zdHJ1Y3QgdGhlIGZpbmFsIG91dHB1dCBiYXNlZCBvbiB0aGUgZGVzaXJlZCBhbGlnbm1lbnQuXG4gICAgICAgIHN3aXRjaCAoYWxpZ24pIHtcbiAgICAgICAgICBjYXNlIFwiPFwiOiByZXR1cm4gdmFsdWVQcmVmaXggKyB2YWx1ZSArIHZhbHVlU3VmZml4ICsgcGFkZGluZztcbiAgICAgICAgICBjYXNlIFwiPVwiOiByZXR1cm4gdmFsdWVQcmVmaXggKyBwYWRkaW5nICsgdmFsdWUgKyB2YWx1ZVN1ZmZpeDtcbiAgICAgICAgICBjYXNlIFwiXlwiOiByZXR1cm4gcGFkZGluZy5zbGljZSgwLCBsZW5ndGggPSBwYWRkaW5nLmxlbmd0aCA+PiAxKSArIHZhbHVlUHJlZml4ICsgdmFsdWUgKyB2YWx1ZVN1ZmZpeCArIHBhZGRpbmcuc2xpY2UobGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFkZGluZyArIHZhbHVlUHJlZml4ICsgdmFsdWUgKyB2YWx1ZVN1ZmZpeDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0UHJlZml4KHNwZWNpZmllciwgdmFsdWUpIHtcbiAgICAgIHZhciBmID0gZm9ybWF0KChzcGVjaWZpZXIgPSBmb3JtYXRTcGVjaWZpZXIoc3BlY2lmaWVyKSwgc3BlY2lmaWVyLnR5cGUgPSBcImZcIiwgc3BlY2lmaWVyKSksXG4gICAgICAgICAgZSA9IE1hdGgubWF4KC04LCBNYXRoLm1pbig4LCBNYXRoLmZsb29yKGV4cG9uZW50KHZhbHVlKSAvIDMpKSkgKiAzLFxuICAgICAgICAgIGsgPSBNYXRoLnBvdygxMCwgLWUpLFxuICAgICAgICAgIHByZWZpeCA9IHByZWZpeGVzWzggKyBlIC8gM107XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGYoayAqIHZhbHVlKSArIHByZWZpeDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZvcm1hdDogZm9ybWF0LFxuICAgICAgZm9ybWF0UHJlZml4OiBmb3JtYXRQcmVmaXhcbiAgICB9O1xuICB9O1xuXG4gIHZhciBkZWZhdWx0TG9jYWxlID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIi5cIixcbiAgICB0aG91c2FuZHM6IFwiLFwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIiRcIiwgXCJcIl1cbiAgfSk7XG5cbiAgdmFyIGNhRVMgPSBsb2NhbGUoe1xuICAgIGRlY2ltYWw6IFwiLFwiLFxuICAgIHRob3VzYW5kczogXCIuXCIsXG4gICAgZ3JvdXBpbmc6IFszXSxcbiAgICBjdXJyZW5jeTogW1wiXCIsIFwiXFx4YTDigqxcIl1cbiAgfSk7XG5cbiAgdmFyIGNzQ1ogPSBsb2NhbGUoe1xuICAgIGRlY2ltYWw6IFwiLFwiLFxuICAgIHRob3VzYW5kczogXCJcXHhhMFwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIlwiLCBcIlxceGEwS8SNXCJdLFxuICB9KTtcblxuICB2YXIgZGVDSCA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIsXCIsXG4gICAgdGhvdXNhbmRzOiBcIidcIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCJcIiwgXCJcXHhhMENIRlwiXVxuICB9KTtcblxuICB2YXIgZGVERSA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIsXCIsXG4gICAgdGhvdXNhbmRzOiBcIi5cIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCJcIiwgXCJcXHhhMOKCrFwiXVxuICB9KTtcblxuICB2YXIgZW5DQSA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIuXCIsXG4gICAgdGhvdXNhbmRzOiBcIixcIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCIkXCIsIFwiXCJdXG4gIH0pO1xuXG4gIHZhciBlbkdCID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIi5cIixcbiAgICB0aG91c2FuZHM6IFwiLFwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIsKjXCIsIFwiXCJdXG4gIH0pO1xuXG4gIHZhciBlc0VTID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIixcIixcbiAgICB0aG91c2FuZHM6IFwiLlwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIlwiLCBcIlxceGEw4oKsXCJdXG4gIH0pO1xuXG4gIHZhciBmaUZJID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIixcIixcbiAgICB0aG91c2FuZHM6IFwiXFx4YTBcIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCJcIiwgXCJcXHhhMOKCrFwiXVxuICB9KTtcblxuICB2YXIgZnJDQSA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIsXCIsXG4gICAgdGhvdXNhbmRzOiBcIlxceGEwXCIsXG4gICAgZ3JvdXBpbmc6IFszXSxcbiAgICBjdXJyZW5jeTogW1wiXCIsIFwiJFwiXVxuICB9KTtcblxuICB2YXIgZnJGUiA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIsXCIsXG4gICAgdGhvdXNhbmRzOiBcIi5cIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCJcIiwgXCJcXHhhMOKCrFwiXVxuICB9KTtcblxuICB2YXIgaGVJTCA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIuXCIsXG4gICAgdGhvdXNhbmRzOiBcIixcIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCLigqpcIiwgXCJcIl1cbiAgfSk7XG5cbiAgdmFyIGh1SFUgPSBsb2NhbGUoe1xuICAgIGRlY2ltYWw6IFwiLFwiLFxuICAgIHRob3VzYW5kczogXCJcXHhhMFwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIlwiLCBcIlxceGEwRnRcIl1cbiAgfSk7XG5cbiAgdmFyIGl0SVQgPSBsb2NhbGUoe1xuICAgIGRlY2ltYWw6IFwiLFwiLFxuICAgIHRob3VzYW5kczogXCIuXCIsXG4gICAgZ3JvdXBpbmc6IFszXSxcbiAgICBjdXJyZW5jeTogW1wi4oKsXCIsIFwiXCJdXG4gIH0pO1xuXG4gIHZhciBqYUpQID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIi5cIixcbiAgICB0aG91c2FuZHM6IFwiLFwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIlwiLCBcIuWGhlwiXVxuICB9KTtcblxuICB2YXIga29LUiA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIuXCIsXG4gICAgdGhvdXNhbmRzOiBcIixcIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCLigqlcIiwgXCJcIl1cbiAgfSk7XG5cbiAgdmFyIG1rTUsgPSBsb2NhbGUoe1xuICAgIGRlY2ltYWw6IFwiLFwiLFxuICAgIHRob3VzYW5kczogXCIuXCIsXG4gICAgZ3JvdXBpbmc6IFszXSxcbiAgICBjdXJyZW5jeTogW1wiXCIsIFwiXFx4YTDQtNC10L0uXCJdXG4gIH0pO1xuXG4gIHZhciBubE5MID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIixcIixcbiAgICB0aG91c2FuZHM6IFwiLlwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIuKCrFxceGEwXCIsIFwiXCJdXG4gIH0pO1xuXG4gIHZhciBwbFBMID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIixcIixcbiAgICB0aG91c2FuZHM6IFwiLlwiLFxuICAgIGdyb3VwaW5nOiBbM10sXG4gICAgY3VycmVuY3k6IFtcIlwiLCBcInrFglwiXVxuICB9KTtcblxuICB2YXIgcHRCUiA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIsXCIsXG4gICAgdGhvdXNhbmRzOiBcIi5cIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCJSJFwiLCBcIlwiXVxuICB9KTtcblxuICB2YXIgcnVSVSA9IGxvY2FsZSh7XG4gICAgZGVjaW1hbDogXCIsXCIsXG4gICAgdGhvdXNhbmRzOiBcIlxceGEwXCIsXG4gICAgZ3JvdXBpbmc6IFszXSxcbiAgICBjdXJyZW5jeTogW1wiXCIsIFwiXFx4YTDRgNGD0LEuXCJdXG4gIH0pO1xuXG4gIHZhciBzdlNFID0gbG9jYWxlKHtcbiAgICBkZWNpbWFsOiBcIixcIixcbiAgICB0aG91c2FuZHM6IFwiXFx4YTBcIixcbiAgICBncm91cGluZzogWzNdLFxuICAgIGN1cnJlbmN5OiBbXCJcIiwgXCJTRUtcIl1cbiAgfSk7XG5cbiAgdmFyIHpoQ04gPSBsb2NhbGUoe1xuICAgIGRlY2ltYWw6IFwiLlwiLFxuICAgIHRob3VzYW5kczogXCIsXCIsXG4gICAgZ3JvdXBpbmc6IFszXSxcbiAgICBjdXJyZW5jeTogW1wiwqVcIiwgXCJcIl1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gcHJlY2lzaW9uRml4ZWQoc3RlcCkge1xuICAgIHJldHVybiBNYXRoLm1heCgwLCAtZXhwb25lbnQoTWF0aC5hYnMoc3RlcCkpKTtcbiAgfTtcblxuICBmdW5jdGlvbiBwcmVjaXNpb25QcmVmaXgoc3RlcCwgdmFsdWUpIHtcbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5tYXgoLTgsIE1hdGgubWluKDgsIE1hdGguZmxvb3IoZXhwb25lbnQodmFsdWUpIC8gMykpKSAqIDMgLSBleHBvbmVudChNYXRoLmFicyhzdGVwKSkpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHByZWNpc2lvblJvdW5kKHN0ZXAsIG1heCkge1xuICAgIHN0ZXAgPSBNYXRoLmFicyhzdGVwKSwgbWF4ID0gTWF0aC5hYnMobWF4KSAtIHN0ZXA7XG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIGV4cG9uZW50KG1heCkgLSBleHBvbmVudChzdGVwKSkgKyAxO1xuICB9O1xuXG4gIHZhciBmb3JtYXQgPSBkZWZhdWx0TG9jYWxlLmZvcm1hdDtcbiAgdmFyIGZvcm1hdFByZWZpeCA9IGRlZmF1bHRMb2NhbGUuZm9ybWF0UHJlZml4O1xuXG4gIHZhciB2ZXJzaW9uID0gXCIwLjQuMlwiO1xuXG4gIGV4cG9ydHMudmVyc2lvbiA9IHZlcnNpb247XG4gIGV4cG9ydHMuZm9ybWF0ID0gZm9ybWF0O1xuICBleHBvcnRzLmZvcm1hdFByZWZpeCA9IGZvcm1hdFByZWZpeDtcbiAgZXhwb3J0cy5sb2NhbGUgPSBsb2NhbGU7XG4gIGV4cG9ydHMubG9jYWxlQ2FFcyA9IGNhRVM7XG4gIGV4cG9ydHMubG9jYWxlQ3NDeiA9IGNzQ1o7XG4gIGV4cG9ydHMubG9jYWxlRGVDaCA9IGRlQ0g7XG4gIGV4cG9ydHMubG9jYWxlRGVEZSA9IGRlREU7XG4gIGV4cG9ydHMubG9jYWxlRW5DYSA9IGVuQ0E7XG4gIGV4cG9ydHMubG9jYWxlRW5HYiA9IGVuR0I7XG4gIGV4cG9ydHMubG9jYWxlRW5VcyA9IGRlZmF1bHRMb2NhbGU7XG4gIGV4cG9ydHMubG9jYWxlRXNFcyA9IGVzRVM7XG4gIGV4cG9ydHMubG9jYWxlRmlGaSA9IGZpRkk7XG4gIGV4cG9ydHMubG9jYWxlRnJDYSA9IGZyQ0E7XG4gIGV4cG9ydHMubG9jYWxlRnJGciA9IGZyRlI7XG4gIGV4cG9ydHMubG9jYWxlSGVJbCA9IGhlSUw7XG4gIGV4cG9ydHMubG9jYWxlSHVIdSA9IGh1SFU7XG4gIGV4cG9ydHMubG9jYWxlSXRJdCA9IGl0SVQ7XG4gIGV4cG9ydHMubG9jYWxlSmFKcCA9IGphSlA7XG4gIGV4cG9ydHMubG9jYWxlS29LciA9IGtvS1I7XG4gIGV4cG9ydHMubG9jYWxlTWtNayA9IG1rTUs7XG4gIGV4cG9ydHMubG9jYWxlTmxObCA9IG5sTkw7XG4gIGV4cG9ydHMubG9jYWxlUGxQbCA9IHBsUEw7XG4gIGV4cG9ydHMubG9jYWxlUHRCciA9IHB0QlI7XG4gIGV4cG9ydHMubG9jYWxlUnVSdSA9IHJ1UlU7XG4gIGV4cG9ydHMubG9jYWxlU3ZTZSA9IHN2U0U7XG4gIGV4cG9ydHMubG9jYWxlWmhDbiA9IHpoQ047XG4gIGV4cG9ydHMuZm9ybWF0U3BlY2lmaWVyID0gZm9ybWF0U3BlY2lmaWVyO1xuICBleHBvcnRzLnByZWNpc2lvbkZpeGVkID0gcHJlY2lzaW9uRml4ZWQ7XG4gIGV4cG9ydHMucHJlY2lzaW9uUHJlZml4ID0gcHJlY2lzaW9uUHJlZml4O1xuICBleHBvcnRzLnByZWNpc2lvblJvdW5kID0gcHJlY2lzaW9uUm91bmQ7XG5cbn0pKTsiLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMsIHJlcXVpcmUoJ2QzLXRpbWUnKSkgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoJ2QzLXRpbWUtZm9ybWF0JywgWydleHBvcnRzJywgJ2QzLXRpbWUnXSwgZmFjdG9yeSkgOlxuICBmYWN0b3J5KChnbG9iYWwuZDNfdGltZV9mb3JtYXQgPSB7fSksZ2xvYmFsLmQzX3RpbWUpO1xufSh0aGlzLCBmdW5jdGlvbiAoZXhwb3J0cyxkM1RpbWUpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIGZ1bmN0aW9uIGxvY2FsRGF0ZShkKSB7XG4gICAgaWYgKDAgPD0gZC55ICYmIGQueSA8IDEwMCkge1xuICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgtMSwgZC5tLCBkLmQsIGQuSCwgZC5NLCBkLlMsIGQuTCk7XG4gICAgICBkYXRlLnNldEZ1bGxZZWFyKGQueSk7XG4gICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKGQueSwgZC5tLCBkLmQsIGQuSCwgZC5NLCBkLlMsIGQuTCk7XG4gIH1cblxuICBmdW5jdGlvbiB1dGNEYXRlKGQpIHtcbiAgICBpZiAoMCA8PSBkLnkgJiYgZC55IDwgMTAwKSB7XG4gICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKERhdGUuVVRDKC0xLCBkLm0sIGQuZCwgZC5ILCBkLk0sIGQuUywgZC5MKSk7XG4gICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKGQueSk7XG4gICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKGQueSwgZC5tLCBkLmQsIGQuSCwgZC5NLCBkLlMsIGQuTCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbmV3WWVhcih5KSB7XG4gICAgcmV0dXJuIHt5OiB5LCBtOiAwLCBkOiAxLCBIOiAwLCBNOiAwLCBTOiAwLCBMOiAwfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvY2FsZSQxKGxvY2FsZSkge1xuICAgIHZhciBsb2NhbGVfZGF0ZVRpbWUgPSBsb2NhbGUuZGF0ZVRpbWUsXG4gICAgICAgIGxvY2FsZV9kYXRlID0gbG9jYWxlLmRhdGUsXG4gICAgICAgIGxvY2FsZV90aW1lID0gbG9jYWxlLnRpbWUsXG4gICAgICAgIGxvY2FsZV9wZXJpb2RzID0gbG9jYWxlLnBlcmlvZHMsXG4gICAgICAgIGxvY2FsZV93ZWVrZGF5cyA9IGxvY2FsZS5kYXlzLFxuICAgICAgICBsb2NhbGVfc2hvcnRXZWVrZGF5cyA9IGxvY2FsZS5zaG9ydERheXMsXG4gICAgICAgIGxvY2FsZV9tb250aHMgPSBsb2NhbGUubW9udGhzLFxuICAgICAgICBsb2NhbGVfc2hvcnRNb250aHMgPSBsb2NhbGUuc2hvcnRNb250aHM7XG5cbiAgICB2YXIgcGVyaW9kUmUgPSBmb3JtYXRSZShsb2NhbGVfcGVyaW9kcyksXG4gICAgICAgIHBlcmlvZExvb2t1cCA9IGZvcm1hdExvb2t1cChsb2NhbGVfcGVyaW9kcyksXG4gICAgICAgIHdlZWtkYXlSZSA9IGZvcm1hdFJlKGxvY2FsZV93ZWVrZGF5cyksXG4gICAgICAgIHdlZWtkYXlMb29rdXAgPSBmb3JtYXRMb29rdXAobG9jYWxlX3dlZWtkYXlzKSxcbiAgICAgICAgc2hvcnRXZWVrZGF5UmUgPSBmb3JtYXRSZShsb2NhbGVfc2hvcnRXZWVrZGF5cyksXG4gICAgICAgIHNob3J0V2Vla2RheUxvb2t1cCA9IGZvcm1hdExvb2t1cChsb2NhbGVfc2hvcnRXZWVrZGF5cyksXG4gICAgICAgIG1vbnRoUmUgPSBmb3JtYXRSZShsb2NhbGVfbW9udGhzKSxcbiAgICAgICAgbW9udGhMb29rdXAgPSBmb3JtYXRMb29rdXAobG9jYWxlX21vbnRocyksXG4gICAgICAgIHNob3J0TW9udGhSZSA9IGZvcm1hdFJlKGxvY2FsZV9zaG9ydE1vbnRocyksXG4gICAgICAgIHNob3J0TW9udGhMb29rdXAgPSBmb3JtYXRMb29rdXAobG9jYWxlX3Nob3J0TW9udGhzKTtcblxuICAgIHZhciBmb3JtYXRzID0ge1xuICAgICAgXCJhXCI6IGZvcm1hdFNob3J0V2Vla2RheSxcbiAgICAgIFwiQVwiOiBmb3JtYXRXZWVrZGF5LFxuICAgICAgXCJiXCI6IGZvcm1hdFNob3J0TW9udGgsXG4gICAgICBcIkJcIjogZm9ybWF0TW9udGgsXG4gICAgICBcImNcIjogbnVsbCxcbiAgICAgIFwiZFwiOiBmb3JtYXREYXlPZk1vbnRoLFxuICAgICAgXCJlXCI6IGZvcm1hdERheU9mTW9udGgsXG4gICAgICBcIkhcIjogZm9ybWF0SG91cjI0LFxuICAgICAgXCJJXCI6IGZvcm1hdEhvdXIxMixcbiAgICAgIFwialwiOiBmb3JtYXREYXlPZlllYXIsXG4gICAgICBcIkxcIjogZm9ybWF0TWlsbGlzZWNvbmRzLFxuICAgICAgXCJtXCI6IGZvcm1hdE1vbnRoTnVtYmVyLFxuICAgICAgXCJNXCI6IGZvcm1hdE1pbnV0ZXMsXG4gICAgICBcInBcIjogZm9ybWF0UGVyaW9kLFxuICAgICAgXCJTXCI6IGZvcm1hdFNlY29uZHMsXG4gICAgICBcIlVcIjogZm9ybWF0V2Vla051bWJlclN1bmRheSxcbiAgICAgIFwid1wiOiBmb3JtYXRXZWVrZGF5TnVtYmVyLFxuICAgICAgXCJXXCI6IGZvcm1hdFdlZWtOdW1iZXJNb25kYXksXG4gICAgICBcInhcIjogbnVsbCxcbiAgICAgIFwiWFwiOiBudWxsLFxuICAgICAgXCJ5XCI6IGZvcm1hdFllYXIsXG4gICAgICBcIllcIjogZm9ybWF0RnVsbFllYXIsXG4gICAgICBcIlpcIjogZm9ybWF0Wm9uZSxcbiAgICAgIFwiJVwiOiBmb3JtYXRMaXRlcmFsUGVyY2VudFxuICAgIH07XG5cbiAgICB2YXIgdXRjRm9ybWF0cyA9IHtcbiAgICAgIFwiYVwiOiBmb3JtYXRVVENTaG9ydFdlZWtkYXksXG4gICAgICBcIkFcIjogZm9ybWF0VVRDV2Vla2RheSxcbiAgICAgIFwiYlwiOiBmb3JtYXRVVENTaG9ydE1vbnRoLFxuICAgICAgXCJCXCI6IGZvcm1hdFVUQ01vbnRoLFxuICAgICAgXCJjXCI6IG51bGwsXG4gICAgICBcImRcIjogZm9ybWF0VVRDRGF5T2ZNb250aCxcbiAgICAgIFwiZVwiOiBmb3JtYXRVVENEYXlPZk1vbnRoLFxuICAgICAgXCJIXCI6IGZvcm1hdFVUQ0hvdXIyNCxcbiAgICAgIFwiSVwiOiBmb3JtYXRVVENIb3VyMTIsXG4gICAgICBcImpcIjogZm9ybWF0VVRDRGF5T2ZZZWFyLFxuICAgICAgXCJMXCI6IGZvcm1hdFVUQ01pbGxpc2Vjb25kcyxcbiAgICAgIFwibVwiOiBmb3JtYXRVVENNb250aE51bWJlcixcbiAgICAgIFwiTVwiOiBmb3JtYXRVVENNaW51dGVzLFxuICAgICAgXCJwXCI6IGZvcm1hdFVUQ1BlcmlvZCxcbiAgICAgIFwiU1wiOiBmb3JtYXRVVENTZWNvbmRzLFxuICAgICAgXCJVXCI6IGZvcm1hdFVUQ1dlZWtOdW1iZXJTdW5kYXksXG4gICAgICBcIndcIjogZm9ybWF0VVRDV2Vla2RheU51bWJlcixcbiAgICAgIFwiV1wiOiBmb3JtYXRVVENXZWVrTnVtYmVyTW9uZGF5LFxuICAgICAgXCJ4XCI6IG51bGwsXG4gICAgICBcIlhcIjogbnVsbCxcbiAgICAgIFwieVwiOiBmb3JtYXRVVENZZWFyLFxuICAgICAgXCJZXCI6IGZvcm1hdFVUQ0Z1bGxZZWFyLFxuICAgICAgXCJaXCI6IGZvcm1hdFVUQ1pvbmUsXG4gICAgICBcIiVcIjogZm9ybWF0TGl0ZXJhbFBlcmNlbnRcbiAgICB9O1xuXG4gICAgdmFyIHBhcnNlcyA9IHtcbiAgICAgIFwiYVwiOiBwYXJzZVNob3J0V2Vla2RheSxcbiAgICAgIFwiQVwiOiBwYXJzZVdlZWtkYXksXG4gICAgICBcImJcIjogcGFyc2VTaG9ydE1vbnRoLFxuICAgICAgXCJCXCI6IHBhcnNlTW9udGgsXG4gICAgICBcImNcIjogcGFyc2VMb2NhbGVEYXRlVGltZSxcbiAgICAgIFwiZFwiOiBwYXJzZURheU9mTW9udGgsXG4gICAgICBcImVcIjogcGFyc2VEYXlPZk1vbnRoLFxuICAgICAgXCJIXCI6IHBhcnNlSG91cjI0LFxuICAgICAgXCJJXCI6IHBhcnNlSG91cjI0LFxuICAgICAgXCJqXCI6IHBhcnNlRGF5T2ZZZWFyLFxuICAgICAgXCJMXCI6IHBhcnNlTWlsbGlzZWNvbmRzLFxuICAgICAgXCJtXCI6IHBhcnNlTW9udGhOdW1iZXIsXG4gICAgICBcIk1cIjogcGFyc2VNaW51dGVzLFxuICAgICAgXCJwXCI6IHBhcnNlUGVyaW9kLFxuICAgICAgXCJTXCI6IHBhcnNlU2Vjb25kcyxcbiAgICAgIFwiVVwiOiBwYXJzZVdlZWtOdW1iZXJTdW5kYXksXG4gICAgICBcIndcIjogcGFyc2VXZWVrZGF5TnVtYmVyLFxuICAgICAgXCJXXCI6IHBhcnNlV2Vla051bWJlck1vbmRheSxcbiAgICAgIFwieFwiOiBwYXJzZUxvY2FsZURhdGUsXG4gICAgICBcIlhcIjogcGFyc2VMb2NhbGVUaW1lLFxuICAgICAgXCJ5XCI6IHBhcnNlWWVhcixcbiAgICAgIFwiWVwiOiBwYXJzZUZ1bGxZZWFyLFxuICAgICAgXCJaXCI6IHBhcnNlWm9uZSxcbiAgICAgIFwiJVwiOiBwYXJzZUxpdGVyYWxQZXJjZW50XG4gICAgfTtcblxuICAgIC8vIFRoZXNlIHJlY3Vyc2l2ZSBkaXJlY3RpdmUgZGVmaW5pdGlvbnMgbXVzdCBiZSBkZWZlcnJlZC5cbiAgICBmb3JtYXRzLnggPSBuZXdGb3JtYXQobG9jYWxlX2RhdGUsIGZvcm1hdHMpO1xuICAgIGZvcm1hdHMuWCA9IG5ld0Zvcm1hdChsb2NhbGVfdGltZSwgZm9ybWF0cyk7XG4gICAgZm9ybWF0cy5jID0gbmV3Rm9ybWF0KGxvY2FsZV9kYXRlVGltZSwgZm9ybWF0cyk7XG4gICAgdXRjRm9ybWF0cy54ID0gbmV3Rm9ybWF0KGxvY2FsZV9kYXRlLCB1dGNGb3JtYXRzKTtcbiAgICB1dGNGb3JtYXRzLlggPSBuZXdGb3JtYXQobG9jYWxlX3RpbWUsIHV0Y0Zvcm1hdHMpO1xuICAgIHV0Y0Zvcm1hdHMuYyA9IG5ld0Zvcm1hdChsb2NhbGVfZGF0ZVRpbWUsIHV0Y0Zvcm1hdHMpO1xuXG4gICAgZnVuY3Rpb24gbmV3Rm9ybWF0KHNwZWNpZmllciwgZm9ybWF0cykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgdmFyIHN0cmluZyA9IFtdLFxuICAgICAgICAgICAgaSA9IC0xLFxuICAgICAgICAgICAgaiA9IDAsXG4gICAgICAgICAgICBuID0gc3BlY2lmaWVyLmxlbmd0aCxcbiAgICAgICAgICAgIGMsXG4gICAgICAgICAgICBwYWQsXG4gICAgICAgICAgICBmb3JtYXQ7XG5cbiAgICAgICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSBkYXRlID0gbmV3IERhdGUoK2RhdGUpO1xuXG4gICAgICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICAgICAgaWYgKHNwZWNpZmllci5jaGFyQ29kZUF0KGkpID09PSAzNykge1xuICAgICAgICAgICAgc3RyaW5nLnB1c2goc3BlY2lmaWVyLnNsaWNlKGosIGkpKTtcbiAgICAgICAgICAgIGlmICgocGFkID0gcGFkc1tjID0gc3BlY2lmaWVyLmNoYXJBdCgrK2kpXSkgIT0gbnVsbCkgYyA9IHNwZWNpZmllci5jaGFyQXQoKytpKTtcbiAgICAgICAgICAgIGVsc2UgcGFkID0gYyA9PT0gXCJlXCIgPyBcIiBcIiA6IFwiMFwiO1xuICAgICAgICAgICAgaWYgKGZvcm1hdCA9IGZvcm1hdHNbY10pIGMgPSBmb3JtYXQoZGF0ZSwgcGFkKTtcbiAgICAgICAgICAgIHN0cmluZy5wdXNoKGMpO1xuICAgICAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0cmluZy5wdXNoKHNwZWNpZmllci5zbGljZShqLCBpKSk7XG4gICAgICAgIHJldHVybiBzdHJpbmcuam9pbihcIlwiKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3UGFyc2Uoc3BlY2lmaWVyLCBuZXdEYXRlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAgIHZhciBkID0gbmV3WWVhcigxOTAwKSxcbiAgICAgICAgICAgIGkgPSBwYXJzZVNwZWNpZmllcihkLCBzcGVjaWZpZXIsIHN0cmluZyArPSBcIlwiLCAwKTtcbiAgICAgICAgaWYgKGkgIT0gc3RyaW5nLmxlbmd0aCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gVGhlIGFtLXBtIGZsYWcgaXMgMCBmb3IgQU0sIGFuZCAxIGZvciBQTS5cbiAgICAgICAgaWYgKFwicFwiIGluIGQpIGQuSCA9IGQuSCAlIDEyICsgZC5wICogMTI7XG5cbiAgICAgICAgLy8gQ29udmVydCBkYXktb2Ytd2VlayBhbmQgd2Vlay1vZi15ZWFyIHRvIGRheS1vZi15ZWFyLlxuICAgICAgICBpZiAoXCJXXCIgaW4gZCB8fCBcIlVcIiBpbiBkKSB7XG4gICAgICAgICAgaWYgKCEoXCJ3XCIgaW4gZCkpIGQudyA9IFwiV1wiIGluIGQgPyAxIDogMDtcbiAgICAgICAgICB2YXIgZGF5ID0gXCJaXCIgaW4gZCA/IHV0Y0RhdGUobmV3WWVhcihkLnkpKS5nZXRVVENEYXkoKSA6IG5ld0RhdGUobmV3WWVhcihkLnkpKS5nZXREYXkoKTtcbiAgICAgICAgICBkLm0gPSAwO1xuICAgICAgICAgIGQuZCA9IFwiV1wiIGluIGQgPyAoZC53ICsgNikgJSA3ICsgZC5XICogNyAtIChkYXkgKyA1KSAlIDcgOiBkLncgKyBkLlUgKiA3IC0gKGRheSArIDYpICUgNztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgdGltZSB6b25lIGlzIHNwZWNpZmllZCwgYWxsIGZpZWxkcyBhcmUgaW50ZXJwcmV0ZWQgYXMgVVRDIGFuZCB0aGVuXG4gICAgICAgIC8vIG9mZnNldCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCB0aW1lIHpvbmUuXG4gICAgICAgIGlmIChcIlpcIiBpbiBkKSB7XG4gICAgICAgICAgZC5IICs9IGQuWiAvIDEwMCB8IDA7XG4gICAgICAgICAgZC5NICs9IGQuWiAlIDEwMDtcbiAgICAgICAgICByZXR1cm4gdXRjRGF0ZShkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgYWxsIGZpZWxkcyBhcmUgaW4gbG9jYWwgdGltZS5cbiAgICAgICAgcmV0dXJuIG5ld0RhdGUoZCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlU3BlY2lmaWVyKGQsIHNwZWNpZmllciwgc3RyaW5nLCBqKSB7XG4gICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgbiA9IHNwZWNpZmllci5sZW5ndGgsXG4gICAgICAgICAgbSA9IHN0cmluZy5sZW5ndGgsXG4gICAgICAgICAgYyxcbiAgICAgICAgICBwYXJzZTtcblxuICAgICAgd2hpbGUgKGkgPCBuKSB7XG4gICAgICAgIGlmIChqID49IG0pIHJldHVybiAtMTtcbiAgICAgICAgYyA9IHNwZWNpZmllci5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICAgIGlmIChjID09PSAzNykge1xuICAgICAgICAgIGMgPSBzcGVjaWZpZXIuY2hhckF0KGkrKyk7XG4gICAgICAgICAgcGFyc2UgPSBwYXJzZXNbYyBpbiBwYWRzID8gc3BlY2lmaWVyLmNoYXJBdChpKyspIDogY107XG4gICAgICAgICAgaWYgKCFwYXJzZSB8fCAoKGogPSBwYXJzZShkLCBzdHJpbmcsIGopKSA8IDApKSByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoYyAhPSBzdHJpbmcuY2hhckNvZGVBdChqKyspKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBqO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlUGVyaW9kKGQsIHN0cmluZywgaSkge1xuICAgICAgdmFyIG4gPSBwZXJpb2RSZS5leGVjKHN0cmluZy5zbGljZShpKSk7XG4gICAgICByZXR1cm4gbiA/IChkLnAgPSBwZXJpb2RMb29rdXBbblswXS50b0xvd2VyQ2FzZSgpXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlU2hvcnRXZWVrZGF5KGQsIHN0cmluZywgaSkge1xuICAgICAgdmFyIG4gPSBzaG9ydFdlZWtkYXlSZS5leGVjKHN0cmluZy5zbGljZShpKSk7XG4gICAgICByZXR1cm4gbiA/IChkLncgPSBzaG9ydFdlZWtkYXlMb29rdXBbblswXS50b0xvd2VyQ2FzZSgpXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShkLCBzdHJpbmcsIGkpIHtcbiAgICAgIHZhciBuID0gd2Vla2RheVJlLmV4ZWMoc3RyaW5nLnNsaWNlKGkpKTtcbiAgICAgIHJldHVybiBuID8gKGQudyA9IHdlZWtkYXlMb29rdXBbblswXS50b0xvd2VyQ2FzZSgpXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlU2hvcnRNb250aChkLCBzdHJpbmcsIGkpIHtcbiAgICAgIHZhciBuID0gc2hvcnRNb250aFJlLmV4ZWMoc3RyaW5nLnNsaWNlKGkpKTtcbiAgICAgIHJldHVybiBuID8gKGQubSA9IHNob3J0TW9udGhMb29rdXBbblswXS50b0xvd2VyQ2FzZSgpXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTW9udGgoZCwgc3RyaW5nLCBpKSB7XG4gICAgICB2YXIgbiA9IG1vbnRoUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICAgICAgcmV0dXJuIG4gPyAoZC5tID0gbW9udGhMb29rdXBbblswXS50b0xvd2VyQ2FzZSgpXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTG9jYWxlRGF0ZVRpbWUoZCwgc3RyaW5nLCBpKSB7XG4gICAgICByZXR1cm4gcGFyc2VTcGVjaWZpZXIoZCwgbG9jYWxlX2RhdGVUaW1lLCBzdHJpbmcsIGkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTG9jYWxlRGF0ZShkLCBzdHJpbmcsIGkpIHtcbiAgICAgIHJldHVybiBwYXJzZVNwZWNpZmllcihkLCBsb2NhbGVfZGF0ZSwgc3RyaW5nLCBpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUxvY2FsZVRpbWUoZCwgc3RyaW5nLCBpKSB7XG4gICAgICByZXR1cm4gcGFyc2VTcGVjaWZpZXIoZCwgbG9jYWxlX3RpbWUsIHN0cmluZywgaSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0U2hvcnRXZWVrZGF5KGQpIHtcbiAgICAgIHJldHVybiBsb2NhbGVfc2hvcnRXZWVrZGF5c1tkLmdldERheSgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRXZWVrZGF5KGQpIHtcbiAgICAgIHJldHVybiBsb2NhbGVfd2Vla2RheXNbZC5nZXREYXkoKV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0U2hvcnRNb250aChkKSB7XG4gICAgICByZXR1cm4gbG9jYWxlX3Nob3J0TW9udGhzW2QuZ2V0TW9udGgoKV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0TW9udGgoZCkge1xuICAgICAgcmV0dXJuIGxvY2FsZV9tb250aHNbZC5nZXRNb250aCgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRQZXJpb2QoZCkge1xuICAgICAgcmV0dXJuIGxvY2FsZV9wZXJpb2RzWysoZC5nZXRIb3VycygpID49IDEyKV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0VVRDU2hvcnRXZWVrZGF5KGQpIHtcbiAgICAgIHJldHVybiBsb2NhbGVfc2hvcnRXZWVrZGF5c1tkLmdldFVUQ0RheSgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRVVENXZWVrZGF5KGQpIHtcbiAgICAgIHJldHVybiBsb2NhbGVfd2Vla2RheXNbZC5nZXRVVENEYXkoKV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0VVRDU2hvcnRNb250aChkKSB7XG4gICAgICByZXR1cm4gbG9jYWxlX3Nob3J0TW9udGhzW2QuZ2V0VVRDTW9udGgoKV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0VVRDTW9udGgoZCkge1xuICAgICAgcmV0dXJuIGxvY2FsZV9tb250aHNbZC5nZXRVVENNb250aCgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRVVENQZXJpb2QoZCkge1xuICAgICAgcmV0dXJuIGxvY2FsZV9wZXJpb2RzWysoZC5nZXRVVENIb3VycygpID49IDEyKV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZvcm1hdDogZnVuY3Rpb24oc3BlY2lmaWVyKSB7XG4gICAgICAgIHZhciBmID0gbmV3Rm9ybWF0KHNwZWNpZmllciArPSBcIlwiLCBmb3JtYXRzKTtcbiAgICAgICAgZi5wYXJzZSA9IG5ld1BhcnNlKHNwZWNpZmllciwgbG9jYWxEYXRlKTtcbiAgICAgICAgZi50b1N0cmluZyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gc3BlY2lmaWVyOyB9O1xuICAgICAgICByZXR1cm4gZjtcbiAgICAgIH0sXG4gICAgICB1dGNGb3JtYXQ6IGZ1bmN0aW9uKHNwZWNpZmllcikge1xuICAgICAgICB2YXIgZiA9IG5ld0Zvcm1hdChzcGVjaWZpZXIgKz0gXCJcIiwgdXRjRm9ybWF0cyk7XG4gICAgICAgIGYucGFyc2UgPSBuZXdQYXJzZShzcGVjaWZpZXIsIHV0Y0RhdGUpO1xuICAgICAgICBmLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7IHJldHVybiBzcGVjaWZpZXI7IH07XG4gICAgICAgIHJldHVybiBmO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgdmFyIHBhZHMgPSB7XCItXCI6IFwiXCIsIFwiX1wiOiBcIiBcIiwgXCIwXCI6IFwiMFwifTtcbiAgdmFyIG51bWJlclJlID0gL15cXHMqXFxkKy87XG4gIHZhciBwZXJjZW50UmUgPSAvXiUvO1xuICB2YXIgcmVxdW90ZVJlID0gL1tcXFxcXFxeXFwkXFwqXFwrXFw/XFx8XFxbXFxdXFwoXFwpXFwuXFx7XFx9XS9nO1xuICBmdW5jdGlvbiBwYWQodmFsdWUsIGZpbGwsIHdpZHRoKSB7XG4gICAgdmFyIHNpZ24gPSB2YWx1ZSA8IDAgPyBcIi1cIiA6IFwiXCIsXG4gICAgICAgIHN0cmluZyA9IChzaWduID8gLXZhbHVlIDogdmFsdWUpICsgXCJcIixcbiAgICAgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcbiAgICByZXR1cm4gc2lnbiArIChsZW5ndGggPCB3aWR0aCA/IG5ldyBBcnJheSh3aWR0aCAtIGxlbmd0aCArIDEpLmpvaW4oZmlsbCkgKyBzdHJpbmcgOiBzdHJpbmcpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVxdW90ZShzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZShyZXF1b3RlUmUsIFwiXFxcXCQmXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0UmUobmFtZXMpIHtcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChcIl4oPzpcIiArIG5hbWVzLm1hcChyZXF1b3RlKS5qb2luKFwifFwiKSArIFwiKVwiLCBcImlcIik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRMb29rdXAobmFtZXMpIHtcbiAgICB2YXIgbWFwID0ge30sIGkgPSAtMSwgbiA9IG5hbWVzLmxlbmd0aDtcbiAgICB3aGlsZSAoKytpIDwgbikgbWFwW25hbWVzW2ldLnRvTG93ZXJDYXNlKCldID0gaTtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VXZWVrZGF5TnVtYmVyKGQsIHN0cmluZywgaSkge1xuICAgIHZhciBuID0gbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDEpKTtcbiAgICByZXR1cm4gbiA/IChkLncgPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VXZWVrTnVtYmVyU3VuZGF5KGQsIHN0cmluZywgaSkge1xuICAgIHZhciBuID0gbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSkpO1xuICAgIHJldHVybiBuID8gKGQuVSA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZVdlZWtOdW1iZXJNb25kYXkoZCwgc3RyaW5nLCBpKSB7XG4gICAgdmFyIG4gPSBudW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpKSk7XG4gICAgcmV0dXJuIG4gPyAoZC5XID0gK25bMF0sIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlRnVsbFllYXIoZCwgc3RyaW5nLCBpKSB7XG4gICAgdmFyIG4gPSBudW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgNCkpO1xuICAgIHJldHVybiBuID8gKGQueSA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZVllYXIoZCwgc3RyaW5nLCBpKSB7XG4gICAgdmFyIG4gPSBudW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMikpO1xuICAgIHJldHVybiBuID8gKGQueSA9ICtuWzBdICsgKCtuWzBdID4gNjggPyAxOTAwIDogMjAwMCksIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlWm9uZShkLCBzdHJpbmcsIGkpIHtcbiAgICB2YXIgbiA9IC9eKFopfChbKy1dXFxkXFxkKSg/OlxcOj8oXFxkXFxkKSk/Ly5leGVjKHN0cmluZy5zbGljZShpLCBpICsgNikpO1xuICAgIHJldHVybiBuID8gKGQuWiA9IG5bMV0gPyAwIDogLShuWzJdICsgKG5bM10gfHwgXCIwMFwiKSksIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlTW9udGhOdW1iZXIoZCwgc3RyaW5nLCBpKSB7XG4gICAgdmFyIG4gPSBudW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMikpO1xuICAgIHJldHVybiBuID8gKGQubSA9IG5bMF0gLSAxLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZURheU9mTW9udGgoZCwgc3RyaW5nLCBpKSB7XG4gICAgdmFyIG4gPSBudW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMikpO1xuICAgIHJldHVybiBuID8gKGQuZCA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZURheU9mWWVhcihkLCBzdHJpbmcsIGkpIHtcbiAgICB2YXIgbiA9IG51bWJlclJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAzKSk7XG4gICAgcmV0dXJuIG4gPyAoZC5tID0gMCwgZC5kID0gK25bMF0sIGkgKyBuWzBdLmxlbmd0aCkgOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlSG91cjI0KGQsIHN0cmluZywgaSkge1xuICAgIHZhciBuID0gbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgICByZXR1cm4gbiA/IChkLkggPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VNaW51dGVzKGQsIHN0cmluZywgaSkge1xuICAgIHZhciBuID0gbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgICByZXR1cm4gbiA/IChkLk0gPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VTZWNvbmRzKGQsIHN0cmluZywgaSkge1xuICAgIHZhciBuID0gbnVtYmVyUmUuZXhlYyhzdHJpbmcuc2xpY2UoaSwgaSArIDIpKTtcbiAgICByZXR1cm4gbiA/IChkLlMgPSArblswXSwgaSArIG5bMF0ubGVuZ3RoKSA6IC0xO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VNaWxsaXNlY29uZHMoZCwgc3RyaW5nLCBpKSB7XG4gICAgdmFyIG4gPSBudW1iZXJSZS5leGVjKHN0cmluZy5zbGljZShpLCBpICsgMykpO1xuICAgIHJldHVybiBuID8gKGQuTCA9ICtuWzBdLCBpICsgblswXS5sZW5ndGgpIDogLTE7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUxpdGVyYWxQZXJjZW50KGQsIHN0cmluZywgaSkge1xuICAgIHZhciBuID0gcGVyY2VudFJlLmV4ZWMoc3RyaW5nLnNsaWNlKGksIGkgKyAxKSk7XG4gICAgcmV0dXJuIG4gPyBpICsgblswXS5sZW5ndGggOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdERheU9mTW9udGgoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZC5nZXREYXRlKCksIHAsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0SG91cjI0KGQsIHApIHtcbiAgICByZXR1cm4gcGFkKGQuZ2V0SG91cnMoKSwgcCwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRIb3VyMTIoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZC5nZXRIb3VycygpICUgMTIgfHwgMTIsIHAsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0RGF5T2ZZZWFyKGQsIHApIHtcbiAgICByZXR1cm4gcGFkKDEgKyBkM1RpbWUuZGF5LmNvdW50KGQzVGltZS55ZWFyKGQpLCBkKSwgcCwgMyk7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRNaWxsaXNlY29uZHMoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZC5nZXRNaWxsaXNlY29uZHMoKSwgcCwgMyk7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRNb250aE51bWJlcihkLCBwKSB7XG4gICAgcmV0dXJuIHBhZChkLmdldE1vbnRoKCkgKyAxLCBwLCAyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdE1pbnV0ZXMoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZC5nZXRNaW51dGVzKCksIHAsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0U2Vjb25kcyhkLCBwKSB7XG4gICAgcmV0dXJuIHBhZChkLmdldFNlY29uZHMoKSwgcCwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRXZWVrTnVtYmVyU3VuZGF5KGQsIHApIHtcbiAgICByZXR1cm4gcGFkKGQzVGltZS5zdW5kYXkuY291bnQoZDNUaW1lLnllYXIoZCksIGQpLCBwLCAyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdFdlZWtkYXlOdW1iZXIoZCkge1xuICAgIHJldHVybiBkLmdldERheSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0V2Vla051bWJlck1vbmRheShkLCBwKSB7XG4gICAgcmV0dXJuIHBhZChkM1RpbWUubW9uZGF5LmNvdW50KGQzVGltZS55ZWFyKGQpLCBkKSwgcCwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRZZWFyKGQsIHApIHtcbiAgICByZXR1cm4gcGFkKGQuZ2V0RnVsbFllYXIoKSAlIDEwMCwgcCwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRGdWxsWWVhcihkLCBwKSB7XG4gICAgcmV0dXJuIHBhZChkLmdldEZ1bGxZZWFyKCkgJSAxMDAwMCwgcCwgNCk7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRab25lKGQpIHtcbiAgICB2YXIgeiA9IGQuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgICByZXR1cm4gKHogPiAwID8gXCItXCIgOiAoeiAqPSAtMSwgXCIrXCIpKVxuICAgICAgICArIHBhZCh6IC8gNjAgfCAwLCBcIjBcIiwgMilcbiAgICAgICAgKyBwYWQoeiAlIDYwLCBcIjBcIiwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRVVENEYXlPZk1vbnRoKGQsIHApIHtcbiAgICByZXR1cm4gcGFkKGQuZ2V0VVRDRGF0ZSgpLCBwLCAyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdFVUQ0hvdXIyNChkLCBwKSB7XG4gICAgcmV0dXJuIHBhZChkLmdldFVUQ0hvdXJzKCksIHAsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0VVRDSG91cjEyKGQsIHApIHtcbiAgICByZXR1cm4gcGFkKGQuZ2V0VVRDSG91cnMoKSAlIDEyIHx8IDEyLCBwLCAyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdFVUQ0RheU9mWWVhcihkLCBwKSB7XG4gICAgcmV0dXJuIHBhZCgxICsgZDNUaW1lLnV0Y0RheS5jb3VudChkM1RpbWUudXRjWWVhcihkKSwgZCksIHAsIDMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0VVRDTWlsbGlzZWNvbmRzKGQsIHApIHtcbiAgICByZXR1cm4gcGFkKGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCksIHAsIDMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0VVRDTW9udGhOdW1iZXIoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZC5nZXRVVENNb250aCgpICsgMSwgcCwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRVVENNaW51dGVzKGQsIHApIHtcbiAgICByZXR1cm4gcGFkKGQuZ2V0VVRDTWludXRlcygpLCBwLCAyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdFVUQ1NlY29uZHMoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZC5nZXRVVENTZWNvbmRzKCksIHAsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0VVRDV2Vla051bWJlclN1bmRheShkLCBwKSB7XG4gICAgcmV0dXJuIHBhZChkM1RpbWUudXRjU3VuZGF5LmNvdW50KGQzVGltZS51dGNZZWFyKGQpLCBkKSwgcCwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXRVVENXZWVrZGF5TnVtYmVyKGQpIHtcbiAgICByZXR1cm4gZC5nZXRVVENEYXkoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdFVUQ1dlZWtOdW1iZXJNb25kYXkoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZDNUaW1lLnV0Y01vbmRheS5jb3VudChkM1RpbWUudXRjWWVhcihkKSwgZCksIHAsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0VVRDWWVhcihkLCBwKSB7XG4gICAgcmV0dXJuIHBhZChkLmdldFVUQ0Z1bGxZZWFyKCkgJSAxMDAsIHAsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0VVRDRnVsbFllYXIoZCwgcCkge1xuICAgIHJldHVybiBwYWQoZC5nZXRVVENGdWxsWWVhcigpICUgMTAwMDAsIHAsIDQpO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0VVRDWm9uZSgpIHtcbiAgICByZXR1cm4gXCIrMDAwMFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0TGl0ZXJhbFBlcmNlbnQoKSB7XG4gICAgcmV0dXJuIFwiJVwiO1xuICB9XG5cbiAgdmFyIGxvY2FsZSA9IGxvY2FsZSQxKHtcbiAgICBkYXRlVGltZTogXCIlYSAlYiAlZSAlWCAlWVwiLFxuICAgIGRhdGU6IFwiJW0vJWQvJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSxcbiAgICBkYXlzOiBbXCJTdW5kYXlcIiwgXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiXSxcbiAgICBzaG9ydERheXM6IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiXSxcbiAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cbiAgfSk7XG5cbiAgdmFyIGNhRVMgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJUEsICVlIGRlICVCIGRlICVZLCAlWFwiLFxuICAgIGRhdGU6IFwiJWQvJW0vJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSxcbiAgICBkYXlzOiBbXCJkaXVtZW5nZVwiLCBcImRpbGx1bnNcIiwgXCJkaW1hcnRzXCIsIFwiZGltZWNyZXNcIiwgXCJkaWpvdXNcIiwgXCJkaXZlbmRyZXNcIiwgXCJkaXNzYWJ0ZVwiXSxcbiAgICBzaG9ydERheXM6IFtcImRnLlwiLCBcImRsLlwiLCBcImR0LlwiLCBcImRjLlwiLCBcImRqLlwiLCBcImR2LlwiLCBcImRzLlwiXSxcbiAgICBtb250aHM6IFtcImdlbmVyXCIsIFwiZmVicmVyXCIsIFwibWFyw6dcIiwgXCJhYnJpbFwiLCBcIm1haWdcIiwgXCJqdW55XCIsIFwianVsaW9sXCIsIFwiYWdvc3RcIiwgXCJzZXRlbWJyZVwiLCBcIm9jdHVicmVcIiwgXCJub3ZlbWJyZVwiLCBcImRlc2VtYnJlXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCJnZW4uXCIsIFwiZmVici5cIiwgXCJtYXLDp1wiLCBcImFici5cIiwgXCJtYWlnXCIsIFwianVueVwiLCBcImp1bC5cIiwgXCJhZy5cIiwgXCJzZXQuXCIsIFwib2N0LlwiLCBcIm5vdi5cIiwgXCJkZXMuXCJdXG4gIH0pO1xuXG4gIHZhciBkZUNIID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVBLCBkZXIgJWUuICVCICVZLCAlWFwiLFxuICAgIGRhdGU6IFwiJWQuJW0uJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSwgLy8gdW51c2VkXG4gICAgZGF5czogW1wiU29ubnRhZ1wiLCBcIk1vbnRhZ1wiLCBcIkRpZW5zdGFnXCIsIFwiTWl0dHdvY2hcIiwgXCJEb25uZXJzdGFnXCIsIFwiRnJlaXRhZ1wiLCBcIlNhbXN0YWdcIl0sXG4gICAgc2hvcnREYXlzOiBbXCJTb1wiLCBcIk1vXCIsIFwiRGlcIiwgXCJNaVwiLCBcIkRvXCIsIFwiRnJcIiwgXCJTYVwiXSxcbiAgICBtb250aHM6IFtcIkphbnVhclwiLCBcIkZlYnJ1YXJcIiwgXCJNw6RyelwiLCBcIkFwcmlsXCIsIFwiTWFpXCIsIFwiSnVuaVwiLCBcIkp1bGlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPa3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZXplbWJlclwiXSxcbiAgICBzaG9ydE1vbnRoczogW1wiSmFuXCIsIFwiRmViXCIsIFwiTXJ6XCIsIFwiQXByXCIsIFwiTWFpXCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2t0XCIsIFwiTm92XCIsIFwiRGV6XCJdXG4gIH0pO1xuXG4gIHZhciBkZURFID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVBLCBkZXIgJWUuICVCICVZLCAlWFwiLFxuICAgIGRhdGU6IFwiJWQuJW0uJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSwgLy8gdW51c2VkXG4gICAgZGF5czogW1wiU29ubnRhZ1wiLCBcIk1vbnRhZ1wiLCBcIkRpZW5zdGFnXCIsIFwiTWl0dHdvY2hcIiwgXCJEb25uZXJzdGFnXCIsIFwiRnJlaXRhZ1wiLCBcIlNhbXN0YWdcIl0sXG4gICAgc2hvcnREYXlzOiBbXCJTb1wiLCBcIk1vXCIsIFwiRGlcIiwgXCJNaVwiLCBcIkRvXCIsIFwiRnJcIiwgXCJTYVwiXSxcbiAgICBtb250aHM6IFtcIkphbnVhclwiLCBcIkZlYnJ1YXJcIiwgXCJNw6RyelwiLCBcIkFwcmlsXCIsIFwiTWFpXCIsIFwiSnVuaVwiLCBcIkp1bGlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPa3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZXplbWJlclwiXSxcbiAgICBzaG9ydE1vbnRoczogW1wiSmFuXCIsIFwiRmViXCIsIFwiTXJ6XCIsIFwiQXByXCIsIFwiTWFpXCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2t0XCIsIFwiTm92XCIsIFwiRGV6XCJdXG4gIH0pO1xuXG4gIHZhciBlbkNBID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVhICViICVlICVYICVZXCIsXG4gICAgZGF0ZTogXCIlWS0lbS0lZFwiLFxuICAgIHRpbWU6IFwiJUg6JU06JVNcIixcbiAgICBwZXJpb2RzOiBbXCJBTVwiLCBcIlBNXCJdLFxuICAgIGRheXM6IFtcIlN1bmRheVwiLCBcIk1vbmRheVwiLCBcIlR1ZXNkYXlcIiwgXCJXZWRuZXNkYXlcIiwgXCJUaHVyc2RheVwiLCBcIkZyaWRheVwiLCBcIlNhdHVyZGF5XCJdLFxuICAgIHNob3J0RGF5czogW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdLFxuICAgIG1vbnRoczogW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl0sXG4gICAgc2hvcnRNb250aHM6IFtcIkphblwiLCBcIkZlYlwiLCBcIk1hclwiLCBcIkFwclwiLCBcIk1heVwiLCBcIkp1blwiLCBcIkp1bFwiLCBcIkF1Z1wiLCBcIlNlcFwiLCBcIk9jdFwiLCBcIk5vdlwiLCBcIkRlY1wiXVxuICB9KTtcblxuICB2YXIgZW5HQiA9IGxvY2FsZSQxKHtcbiAgICBkYXRlVGltZTogXCIlYSAlZSAlYiAlWCAlWVwiLFxuICAgIGRhdGU6IFwiJWQvJW0vJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSxcbiAgICBkYXlzOiBbXCJTdW5kYXlcIiwgXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiXSxcbiAgICBzaG9ydERheXM6IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiXSxcbiAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cbiAgfSk7XG5cbiAgdmFyIGVzRVMgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJUEsICVlIGRlICVCIGRlICVZLCAlWFwiLFxuICAgIGRhdGU6IFwiJWQvJW0vJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSxcbiAgICBkYXlzOiBbXCJkb21pbmdvXCIsIFwibHVuZXNcIiwgXCJtYXJ0ZXNcIiwgXCJtacOpcmNvbGVzXCIsIFwianVldmVzXCIsIFwidmllcm5lc1wiLCBcInPDoWJhZG9cIl0sXG4gICAgc2hvcnREYXlzOiBbXCJkb21cIiwgXCJsdW5cIiwgXCJtYXJcIiwgXCJtacOpXCIsIFwianVlXCIsIFwidmllXCIsIFwic8OhYlwiXSxcbiAgICBtb250aHM6IFtcImVuZXJvXCIsIFwiZmVicmVyb1wiLCBcIm1hcnpvXCIsIFwiYWJyaWxcIiwgXCJtYXlvXCIsIFwianVuaW9cIiwgXCJqdWxpb1wiLCBcImFnb3N0b1wiLCBcInNlcHRpZW1icmVcIiwgXCJvY3R1YnJlXCIsIFwibm92aWVtYnJlXCIsIFwiZGljaWVtYnJlXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCJlbmVcIiwgXCJmZWJcIiwgXCJtYXJcIiwgXCJhYnJcIiwgXCJtYXlcIiwgXCJqdW5cIiwgXCJqdWxcIiwgXCJhZ29cIiwgXCJzZXBcIiwgXCJvY3RcIiwgXCJub3ZcIiwgXCJkaWNcIl1cbiAgfSk7XG5cbiAgdmFyIGZpRkkgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJUEsICUtZC4gJUJ0YSAlWSBrbG8gJVhcIixcbiAgICBkYXRlOiBcIiUtZC4lLW0uJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiYS5tLlwiLCBcInAubS5cIl0sXG4gICAgZGF5czogW1wic3VubnVudGFpXCIsIFwibWFhbmFudGFpXCIsIFwidGlpc3RhaVwiLCBcImtlc2tpdmlpa2tvXCIsIFwidG9yc3RhaVwiLCBcInBlcmphbnRhaVwiLCBcImxhdWFudGFpXCJdLFxuICAgIHNob3J0RGF5czogW1wiU3VcIiwgXCJNYVwiLCBcIlRpXCIsIFwiS2VcIiwgXCJUb1wiLCBcIlBlXCIsIFwiTGFcIl0sXG4gICAgbW9udGhzOiBbXCJ0YW1taWt1dVwiLCBcImhlbG1pa3V1XCIsIFwibWFhbGlza3V1XCIsIFwiaHVodGlrdXVcIiwgXCJ0b3Vrb2t1dVwiLCBcImtlc8Oka3V1XCIsIFwiaGVpbsOka3V1XCIsIFwiZWxva3V1XCIsIFwic3l5c2t1dVwiLCBcImxva2FrdXVcIiwgXCJtYXJyYXNrdXVcIiwgXCJqb3VsdWt1dVwiXSxcbiAgICBzaG9ydE1vbnRoczogW1wiVGFtbWlcIiwgXCJIZWxtaVwiLCBcIk1hYWxpc1wiLCBcIkh1aHRpXCIsIFwiVG91a29cIiwgXCJLZXPDpFwiLCBcIkhlaW7DpFwiLCBcIkVsb1wiLCBcIlN5eXNcIiwgXCJMb2thXCIsIFwiTWFycmFzXCIsIFwiSm91bHVcIl1cbiAgfSk7XG5cbiAgdmFyIGZyQ0EgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJWEgJWUgJWIgJVkgJVhcIixcbiAgICBkYXRlOiBcIiVZLSVtLSVkXCIsXG4gICAgdGltZTogXCIlSDolTTolU1wiLFxuICAgIHBlcmlvZHM6IFtcIlwiLCBcIlwiXSxcbiAgICBkYXlzOiBbXCJkaW1hbmNoZVwiLCBcImx1bmRpXCIsIFwibWFyZGlcIiwgXCJtZXJjcmVkaVwiLCBcImpldWRpXCIsIFwidmVuZHJlZGlcIiwgXCJzYW1lZGlcIl0sXG4gICAgc2hvcnREYXlzOiBbXCJkaW1cIiwgXCJsdW5cIiwgXCJtYXJcIiwgXCJtZXJcIiwgXCJqZXVcIiwgXCJ2ZW5cIiwgXCJzYW1cIl0sXG4gICAgbW9udGhzOiBbXCJqYW52aWVyXCIsIFwiZsOpdnJpZXJcIiwgXCJtYXJzXCIsIFwiYXZyaWxcIiwgXCJtYWlcIiwgXCJqdWluXCIsIFwianVpbGxldFwiLCBcImFvw7t0XCIsIFwic2VwdGVtYnJlXCIsIFwib2N0b2JyZVwiLCBcIm5vdmVtYnJlXCIsIFwiZMOpY2VtYnJlXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCJqYW5cIiwgXCJmw6l2XCIsIFwibWFyXCIsIFwiYXZyXCIsIFwibWFpXCIsIFwianVpXCIsIFwianVsXCIsIFwiYW/Du1wiLCBcInNlcFwiLCBcIm9jdFwiLCBcIm5vdlwiLCBcImTDqWNcIl1cbiAgfSk7XG5cbiAgdmFyIGZyRlIgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJUEsIGxlICVlICVCICVZLCAlWFwiLFxuICAgIGRhdGU6IFwiJWQvJW0vJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSwgLy8gdW51c2VkXG4gICAgZGF5czogW1wiZGltYW5jaGVcIiwgXCJsdW5kaVwiLCBcIm1hcmRpXCIsIFwibWVyY3JlZGlcIiwgXCJqZXVkaVwiLCBcInZlbmRyZWRpXCIsIFwic2FtZWRpXCJdLFxuICAgIHNob3J0RGF5czogW1wiZGltLlwiLCBcImx1bi5cIiwgXCJtYXIuXCIsIFwibWVyLlwiLCBcImpldS5cIiwgXCJ2ZW4uXCIsIFwic2FtLlwiXSxcbiAgICBtb250aHM6IFtcImphbnZpZXJcIiwgXCJmw6l2cmllclwiLCBcIm1hcnNcIiwgXCJhdnJpbFwiLCBcIm1haVwiLCBcImp1aW5cIiwgXCJqdWlsbGV0XCIsIFwiYW/Du3RcIiwgXCJzZXB0ZW1icmVcIiwgXCJvY3RvYnJlXCIsIFwibm92ZW1icmVcIiwgXCJkw6ljZW1icmVcIl0sXG4gICAgc2hvcnRNb250aHM6IFtcImphbnYuXCIsIFwiZsOpdnIuXCIsIFwibWFyc1wiLCBcImF2ci5cIiwgXCJtYWlcIiwgXCJqdWluXCIsIFwianVpbC5cIiwgXCJhb8O7dFwiLCBcInNlcHQuXCIsIFwib2N0LlwiLCBcIm5vdi5cIiwgXCJkw6ljLlwiXVxuICB9KTtcblxuICB2YXIgaGVJTCA9IGxvY2FsZSQxKHtcbiAgICBkYXRlVGltZTogXCIlQSwgJWUg15ElQiAlWSAlWFwiLFxuICAgIGRhdGU6IFwiJWQuJW0uJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSxcbiAgICBkYXlzOiBbXCLXqNeQ16nXldefXCIsIFwi16nXoNeZXCIsIFwi16nXnNeZ16nXmVwiLCBcIteo15HXmdei15lcIiwgXCLXl9ee15nXqdeZXCIsIFwi16nXmdep15lcIiwgXCLXqdeR16pcIl0sXG4gICAgc2hvcnREYXlzOiBbXCLXkNezXCIsIFwi15HXs1wiLCBcIteS17NcIiwgXCLXk9ezXCIsIFwi15TXs1wiLCBcIteV17NcIiwgXCLXqdezXCJdLFxuICAgIG1vbnRoczogW1wi15nXoNeV15DXqFwiLCBcItek15HXqNeV15DXqFwiLCBcItee16jXpVwiLCBcIteQ16TXqNeZ15xcIiwgXCLXnteQ15lcIiwgXCLXmdeV16DXmVwiLCBcIteZ15XXnNeZXCIsIFwi15DXldeS15XXodeYXCIsIFwi16HXpNeY157XkdeoXCIsIFwi15DXlden15jXldeR16hcIiwgXCLXoNeV15HXnteR16hcIiwgXCLXk9em157XkdeoXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCLXmdeg15XXs1wiLCBcItek15HXqNezXCIsIFwi157XqNelXCIsIFwi15DXpNeo17NcIiwgXCLXnteQ15lcIiwgXCLXmdeV16DXmVwiLCBcIteZ15XXnNeZXCIsIFwi15DXldeS17NcIiwgXCLXodek15jXs1wiLCBcIteQ15XXp9ezXCIsIFwi16DXldeR17NcIiwgXCLXk9em157Xs1wiXVxuICB9KTtcblxuICB2YXIgaHVIVSA9IGxvY2FsZSQxKHtcbiAgICBkYXRlVGltZTogXCIlWS4gJUIgJS1lLiwgJUEgJVhcIixcbiAgICBkYXRlOiBcIiVZLiAlbS4gJWQuXCIsXG4gICAgdGltZTogXCIlSDolTTolU1wiLFxuICAgIHBlcmlvZHM6IFtcImRlLlwiLCBcImR1LlwiXSwgLy8gdW51c2VkXG4gICAgZGF5czogW1widmFzw6FybmFwXCIsIFwiaMOpdGbFkVwiLCBcImtlZGRcIiwgXCJzemVyZGFcIiwgXCJjc8O8dMO2cnTDtmtcIiwgXCJww6ludGVrXCIsIFwic3pvbWJhdFwiXSxcbiAgICBzaG9ydERheXM6IFtcIlZcIiwgXCJIXCIsIFwiS1wiLCBcIlN6ZVwiLCBcIkNzXCIsIFwiUFwiLCBcIlN6b1wiXSxcbiAgICBtb250aHM6IFtcImphbnXDoXJcIiwgXCJmZWJydcOhclwiLCBcIm3DoXJjaXVzXCIsIFwiw6FwcmlsaXNcIiwgXCJtw6FqdXNcIiwgXCJqw7puaXVzXCIsIFwiasO6bGl1c1wiLCBcImF1Z3VzenR1c1wiLCBcInN6ZXB0ZW1iZXJcIiwgXCJva3TDs2JlclwiLCBcIm5vdmVtYmVyXCIsIFwiZGVjZW1iZXJcIl0sXG4gICAgc2hvcnRNb250aHM6IFtcImphbi5cIiwgXCJmZWIuXCIsIFwibcOhci5cIiwgXCLDoXByLlwiLCBcIm3DoWouXCIsIFwiasO6bi5cIiwgXCJqw7psLlwiLCBcImF1Zy5cIiwgXCJzemVwdC5cIiwgXCJva3QuXCIsIFwibm92LlwiLCBcImRlYy5cIl1cbiAgfSk7XG5cbiAgdmFyIGl0SVQgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJUEgJWUgJUIgJVksICVYXCIsXG4gICAgZGF0ZTogXCIlZC8lbS8lWVwiLFxuICAgIHRpbWU6IFwiJUg6JU06JVNcIixcbiAgICBwZXJpb2RzOiBbXCJBTVwiLCBcIlBNXCJdLCAvLyB1bnVzZWRcbiAgICBkYXlzOiBbXCJEb21lbmljYVwiLCBcIkx1bmVkw6xcIiwgXCJNYXJ0ZWTDrFwiLCBcIk1lcmNvbGVkw6xcIiwgXCJHaW92ZWTDrFwiLCBcIlZlbmVyZMOsXCIsIFwiU2FiYXRvXCJdLFxuICAgIHNob3J0RGF5czogW1wiRG9tXCIsIFwiTHVuXCIsIFwiTWFyXCIsIFwiTWVyXCIsIFwiR2lvXCIsIFwiVmVuXCIsIFwiU2FiXCJdLFxuICAgIG1vbnRoczogW1wiR2VubmFpb1wiLCBcIkZlYmJyYWlvXCIsIFwiTWFyem9cIiwgXCJBcHJpbGVcIiwgXCJNYWdnaW9cIiwgXCJHaXVnbm9cIiwgXCJMdWdsaW9cIiwgXCJBZ29zdG9cIiwgXCJTZXR0ZW1icmVcIiwgXCJPdHRvYnJlXCIsIFwiTm92ZW1icmVcIiwgXCJEaWNlbWJyZVwiXSxcbiAgICBzaG9ydE1vbnRoczogW1wiR2VuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWFnXCIsIFwiR2l1XCIsIFwiTHVnXCIsIFwiQWdvXCIsIFwiU2V0XCIsIFwiT3R0XCIsIFwiTm92XCIsIFwiRGljXCJdXG4gIH0pO1xuXG4gIHZhciBqYUpQID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVZICViICVlICVhICVYXCIsXG4gICAgZGF0ZTogXCIlWS8lbS8lZFwiLFxuICAgIHRpbWU6IFwiJUg6JU06JVNcIixcbiAgICBwZXJpb2RzOiBbXCJBTVwiLCBcIlBNXCJdLFxuICAgIGRheXM6IFtcIuaXpeabnOaXpVwiLCBcIuaciOabnOaXpVwiLCBcIueBq+abnOaXpVwiLCBcIuawtOabnOaXpVwiLCBcIuacqOabnOaXpVwiLCBcIumHkeabnOaXpVwiLCBcIuWcn+abnOaXpVwiXSxcbiAgICBzaG9ydERheXM6IFtcIuaXpVwiLCBcIuaciFwiLCBcIueBq1wiLCBcIuawtFwiLCBcIuacqFwiLCBcIumHkVwiLCBcIuWcn1wiXSxcbiAgICBtb250aHM6IFtcIuedpuaciFwiLCBcIuWmguaciFwiLCBcIuW8peeUn1wiLCBcIuWNr+aciFwiLCBcIueakOaciFwiLCBcIuawtOeEoeaciFwiLCBcIuaWh+aciFwiLCBcIuiRieaciFwiLCBcIumVt+aciFwiLCBcIuelnueEoeaciFwiLCBcIumcnOaciFwiLCBcIuW4q+i1sFwiXSxcbiAgICBzaG9ydE1vbnRoczogW1wiMeaciFwiLCBcIjLmnIhcIiwgXCIz5pyIXCIsIFwiNOaciFwiLCBcIjXmnIhcIiwgXCI25pyIXCIsIFwiN+aciFwiLCBcIjjmnIhcIiwgXCI55pyIXCIsIFwiMTDmnIhcIiwgXCIxMeaciFwiLCBcIjEy5pyIXCJdXG4gIH0pO1xuXG4gIHZhciBrb0tSID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVZLyVtLyVkICVhICVYXCIsXG4gICAgZGF0ZTogXCIlWS8lbS8lZFwiLFxuICAgIHRpbWU6IFwiJUg6JU06JVNcIixcbiAgICBwZXJpb2RzOiBbXCLsmKTsoIRcIiwgXCLsmKTtm4RcIl0sXG4gICAgZGF5czogW1wi7J287JqU7J28XCIsIFwi7JuU7JqU7J28XCIsIFwi7ZmU7JqU7J28XCIsIFwi7IiY7JqU7J28XCIsIFwi66qp7JqU7J28XCIsIFwi6riI7JqU7J28XCIsIFwi7Yag7JqU7J28XCJdLFxuICAgIHNob3J0RGF5czogW1wi7J28XCIsIFwi7JuUXCIsIFwi7ZmUXCIsIFwi7IiYXCIsIFwi66qpXCIsIFwi6riIXCIsIFwi7YagXCJdLFxuICAgIG1vbnRoczogW1wiMeyblFwiLCBcIjLsm5RcIiwgXCIz7JuUXCIsIFwiNOyblFwiLCBcIjXsm5RcIiwgXCI27JuUXCIsIFwiN+yblFwiLCBcIjjsm5RcIiwgXCI57JuUXCIsIFwiMTDsm5RcIiwgXCIxMeyblFwiLCBcIjEy7JuUXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCIx7JuUXCIsIFwiMuyblFwiLCBcIjPsm5RcIiwgXCI07JuUXCIsIFwiNeyblFwiLCBcIjbsm5RcIiwgXCI37JuUXCIsIFwiOOyblFwiLCBcIjnsm5RcIiwgXCIxMOyblFwiLCBcIjEx7JuUXCIsIFwiMTLsm5RcIl1cbiAgfSk7XG5cbiAgdmFyIG1rTUsgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJUEsICVlICVCICVZINCzLiAlWFwiLFxuICAgIGRhdGU6IFwiJWQuJW0uJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSxcbiAgICBkYXlzOiBbXCLQvdC10LTQtdC70LBcIiwgXCLQv9C+0L3QtdC00LXQu9C90LjQulwiLCBcItCy0YLQvtGA0L3QuNC6XCIsIFwi0YHRgNC10LTQsFwiLCBcItGH0LXRgtCy0YDRgtC+0LpcIiwgXCLQv9C10YLQvtC6XCIsIFwi0YHQsNCx0L7RgtCwXCJdLFxuICAgIHNob3J0RGF5czogW1wi0L3QtdC0XCIsIFwi0L/QvtC9XCIsIFwi0LLRgtC+XCIsIFwi0YHRgNC1XCIsIFwi0YfQtdGCXCIsIFwi0L/QtdGCXCIsIFwi0YHQsNCxXCJdLFxuICAgIG1vbnRoczogW1wi0ZjQsNC90YPQsNGA0LhcIiwgXCLRhNC10LLRgNGD0LDRgNC4XCIsIFwi0LzQsNGA0YJcIiwgXCLQsNC/0YDQuNC7XCIsIFwi0LzQsNGYXCIsIFwi0ZjRg9C90LhcIiwgXCLRmNGD0LvQuFwiLCBcItCw0LLQs9GD0YHRglwiLCBcItGB0LXQv9GC0LXQvNCy0YDQuFwiLCBcItC+0LrRgtC+0LzQstGA0LhcIiwgXCLQvdC+0LXQvNCy0YDQuFwiLCBcItC00LXQutC10LzQstGA0LhcIl0sXG4gICAgc2hvcnRNb250aHM6IFtcItGY0LDQvVwiLCBcItGE0LXQslwiLCBcItC80LDRgFwiLCBcItCw0L/RgFwiLCBcItC80LDRmFwiLCBcItGY0YPQvVwiLCBcItGY0YPQu1wiLCBcItCw0LLQs1wiLCBcItGB0LXQv1wiLCBcItC+0LrRglwiLCBcItC90L7QtVwiLCBcItC00LXQulwiXVxuICB9KTtcblxuICB2YXIgbmxOTCA9IGxvY2FsZSQxKHtcbiAgICBkYXRlVGltZTogXCIlYSAlZSAlQiAlWSAlVFwiLFxuICAgIGRhdGU6IFwiJWQtJW0tJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSwgLy8gdW51c2VkXG4gICAgZGF5czogW1wiem9uZGFnXCIsIFwibWFhbmRhZ1wiLCBcImRpbnNkYWdcIiwgXCJ3b2Vuc2RhZ1wiLCBcImRvbmRlcmRhZ1wiLCBcInZyaWpkYWdcIiwgXCJ6YXRlcmRhZ1wiXSxcbiAgICBzaG9ydERheXM6IFtcInpvXCIsIFwibWFcIiwgXCJkaVwiLCBcIndvXCIsIFwiZG9cIiwgXCJ2clwiLCBcInphXCJdLFxuICAgIG1vbnRoczogW1wiamFudWFyaVwiLCBcImZlYnJ1YXJpXCIsIFwibWFhcnRcIiwgXCJhcHJpbFwiLCBcIm1laVwiLCBcImp1bmlcIiwgXCJqdWxpXCIsIFwiYXVndXN0dXNcIiwgXCJzZXB0ZW1iZXJcIiwgXCJva3RvYmVyXCIsIFwibm92ZW1iZXJcIiwgXCJkZWNlbWJlclwiXSxcbiAgICBzaG9ydE1vbnRoczogW1wiamFuXCIsIFwiZmViXCIsIFwibXJ0XCIsIFwiYXByXCIsIFwibWVpXCIsIFwianVuXCIsIFwianVsXCIsIFwiYXVnXCIsIFwic2VwXCIsIFwib2t0XCIsIFwibm92XCIsIFwiZGVjXCJdXG4gIH0pO1xuXG4gIHZhciBwbFBMID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVBLCAlZSAlQiAlWSwgJVhcIixcbiAgICBkYXRlOiBcIiVkLyVtLyVZXCIsXG4gICAgdGltZTogXCIlSDolTTolU1wiLFxuICAgIHBlcmlvZHM6IFtcIkFNXCIsIFwiUE1cIl0sIC8vIHVudXNlZFxuICAgIGRheXM6IFtcIk5pZWR6aWVsYVwiLCBcIlBvbmllZHppYcWCZWtcIiwgXCJXdG9yZWtcIiwgXCLFmnJvZGFcIiwgXCJDendhcnRla1wiLCBcIlBpxIV0ZWtcIiwgXCJTb2JvdGFcIl0sXG4gICAgc2hvcnREYXlzOiBbXCJOaWVkei5cIiwgXCJQb24uXCIsIFwiV3QuXCIsIFwixZpyLlwiLCBcIkN6dy5cIiwgXCJQdC5cIiwgXCJTb2IuXCJdLFxuICAgIG1vbnRoczogW1wiU3R5Y3plxYRcIiwgXCJMdXR5XCIsIFwiTWFyemVjXCIsIFwiS3dpZWNpZcWEXCIsIFwiTWFqXCIsIFwiQ3plcndpZWNcIiwgXCJMaXBpZWNcIiwgXCJTaWVycGllxYRcIiwgXCJXcnplc2llxYRcIiwgXCJQYcW6ZHppZXJuaWtcIiwgXCJMaXN0b3BhZFwiLCBcIkdydWR6aWXFhFwiXSxcbiAgICBzaG9ydE1vbnRoczogW1wiU3R5Y3ouXCIsIFwiTHV0eVwiLCBcIk1hcnouXCIsIFwiS3dpZS5cIiwgXCJNYWpcIiwgXCJDemVydy5cIiwgXCJMaXBjLlwiLCBcIlNpZXJwLlwiLCBcIldyei5cIiwgXCJQYcW6ZHouXCIsIFwiTGlzdG9wLlwiLCBcIkdydWR6LlwiXS8qIEluIFBvbGlzaCBsYW5ndWFnZSBhYmJyYXZpYXRlZCBtb250aHMgYXJlIG5vdCBjb21tb25seSB1c2VkIHNvIHRoZXJlIGlzIGEgZGlzcHV0ZSBhYm91dCB0aGUgcHJvcGVyIGFiYnJhdmlhdGlvbnMuICovXG4gIH0pO1xuXG4gIHZhciBwdEJSID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVBLCAlZSBkZSAlQiBkZSAlWS4gJVhcIixcbiAgICBkYXRlOiBcIiVkLyVtLyVZXCIsXG4gICAgdGltZTogXCIlSDolTTolU1wiLFxuICAgIHBlcmlvZHM6IFtcIkFNXCIsIFwiUE1cIl0sXG4gICAgZGF5czogW1wiRG9taW5nb1wiLCBcIlNlZ3VuZGFcIiwgXCJUZXLDp2FcIiwgXCJRdWFydGFcIiwgXCJRdWludGFcIiwgXCJTZXh0YVwiLCBcIlPDoWJhZG9cIl0sXG4gICAgc2hvcnREYXlzOiBbXCJEb21cIiwgXCJTZWdcIiwgXCJUZXJcIiwgXCJRdWFcIiwgXCJRdWlcIiwgXCJTZXhcIiwgXCJTw6FiXCJdLFxuICAgIG1vbnRoczogW1wiSmFuZWlyb1wiLCBcIkZldmVyZWlyb1wiLCBcIk1hcsOnb1wiLCBcIkFicmlsXCIsIFwiTWFpb1wiLCBcIkp1bmhvXCIsIFwiSnVsaG9cIiwgXCJBZ29zdG9cIiwgXCJTZXRlbWJyb1wiLCBcIk91dHVicm9cIiwgXCJOb3ZlbWJyb1wiLCBcIkRlemVtYnJvXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCJKYW5cIiwgXCJGZXZcIiwgXCJNYXJcIiwgXCJBYnJcIiwgXCJNYWlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBZ29cIiwgXCJTZXRcIiwgXCJPdXRcIiwgXCJOb3ZcIiwgXCJEZXpcIl1cbiAgfSk7XG5cbiAgdmFyIHJ1UlUgPSBsb2NhbGUkMSh7XG4gICAgZGF0ZVRpbWU6IFwiJUEsICVlICVCICVZINCzLiAlWFwiLFxuICAgIGRhdGU6IFwiJWQuJW0uJVlcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiQU1cIiwgXCJQTVwiXSxcbiAgICBkYXlzOiBbXCLQstC+0YHQutGA0LXRgdC10L3RjNC1XCIsIFwi0L/QvtC90LXQtNC10LvRjNC90LjQulwiLCBcItCy0YLQvtGA0L3QuNC6XCIsIFwi0YHRgNC10LTQsFwiLCBcItGH0LXRgtCy0LXRgNCzXCIsIFwi0L/Rj9GC0L3QuNGG0LBcIiwgXCLRgdGD0LHQsdC+0YLQsFwiXSxcbiAgICBzaG9ydERheXM6IFtcItCy0YFcIiwgXCLQv9C9XCIsIFwi0LLRglwiLCBcItGB0YBcIiwgXCLRh9GCXCIsIFwi0L/RglwiLCBcItGB0LFcIl0sXG4gICAgbW9udGhzOiBbXCLRj9C90LLQsNGA0Y9cIiwgXCLRhNC10LLRgNCw0LvRj1wiLCBcItC80LDRgNGC0LBcIiwgXCLQsNC/0YDQtdC70Y9cIiwgXCLQvNCw0Y9cIiwgXCLQuNGO0L3Rj1wiLCBcItC40Y7Qu9GPXCIsIFwi0LDQstCz0YPRgdGC0LBcIiwgXCLRgdC10L3RgtGP0LHRgNGPXCIsIFwi0L7QutGC0Y/QsdGA0Y9cIiwgXCLQvdC+0Y/QsdGA0Y9cIiwgXCLQtNC10LrQsNCx0YDRj1wiXSxcbiAgICBzaG9ydE1vbnRoczogW1wi0Y/QvdCyXCIsIFwi0YTQtdCyXCIsIFwi0LzQsNGAXCIsIFwi0LDQv9GAXCIsIFwi0LzQsNC5XCIsIFwi0LjRjtC9XCIsIFwi0LjRjtC7XCIsIFwi0LDQstCzXCIsIFwi0YHQtdC9XCIsIFwi0L7QutGCXCIsIFwi0L3QvtGPXCIsIFwi0LTQtdC6XCJdXG4gIH0pO1xuXG4gIHZhciBzdlNFID0gbG9jYWxlJDEoe1xuICAgIGRhdGVUaW1lOiBcIiVBIGRlbiAlZCAlQiAlWSAlWFwiLFxuICAgIGRhdGU6IFwiJVktJW0tJWRcIixcbiAgICB0aW1lOiBcIiVIOiVNOiVTXCIsXG4gICAgcGVyaW9kczogW1wiZm1cIiwgXCJlbVwiXSxcbiAgICBkYXlzOiBbXCJTw7ZuZGFnXCIsIFwiTcOlbmRhZ1wiLCBcIlRpc2RhZ1wiLCBcIk9uc2RhZ1wiLCBcIlRvcnNkYWdcIiwgXCJGcmVkYWdcIiwgXCJMw7ZyZGFnXCJdLFxuICAgIHNob3J0RGF5czogW1wiU8O2blwiLCBcIk3DpW5cIiwgXCJUaXNcIiwgXCJPbnNcIiwgXCJUb3JcIiwgXCJGcmVcIiwgXCJMw7ZyXCJdLFxuICAgIG1vbnRoczogW1wiSmFudWFyaVwiLCBcIkZlYnJ1YXJpXCIsIFwiTWFyc1wiLCBcIkFwcmlsXCIsIFwiTWFqXCIsIFwiSnVuaVwiLCBcIkp1bGlcIiwgXCJBdWd1c3RpXCIsIFwiU2VwdGVtYmVyXCIsIFwiT2t0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl0sXG4gICAgc2hvcnRNb250aHM6IFtcIkphblwiLCBcIkZlYlwiLCBcIk1hclwiLCBcIkFwclwiLCBcIk1halwiLCBcIkp1blwiLCBcIkp1bFwiLCBcIkF1Z1wiLCBcIlNlcFwiLCBcIk9rdFwiLCBcIk5vdlwiLCBcIkRlY1wiXVxuICB9KTtcblxuICB2YXIgemhDTiA9IGxvY2FsZSQxKHtcbiAgICBkYXRlVGltZTogXCIlYSAlYiAlZSAlWCAlWVwiLFxuICAgIGRhdGU6IFwiJVkvJS1tLyUtZFwiLFxuICAgIHRpbWU6IFwiJUg6JU06JVNcIixcbiAgICBwZXJpb2RzOiBbXCLkuIrljYhcIiwgXCLkuIvljYhcIl0sXG4gICAgZGF5czogW1wi5pif5pyf5pelXCIsIFwi5pif5pyf5LiAXCIsIFwi5pif5pyf5LqMXCIsIFwi5pif5pyf5LiJXCIsIFwi5pif5pyf5ZubXCIsIFwi5pif5pyf5LqUXCIsIFwi5pif5pyf5YWtXCJdLFxuICAgIHNob3J0RGF5czogW1wi5pif5pyf5pelXCIsIFwi5pif5pyf5LiAXCIsIFwi5pif5pyf5LqMXCIsIFwi5pif5pyf5LiJXCIsIFwi5pif5pyf5ZubXCIsIFwi5pif5pyf5LqUXCIsIFwi5pif5pyf5YWtXCJdLFxuICAgIG1vbnRoczogW1wi5LiA5pyIXCIsIFwi5LqM5pyIXCIsIFwi5LiJ5pyIXCIsIFwi5Zub5pyIXCIsIFwi5LqU5pyIXCIsIFwi5YWt5pyIXCIsIFwi5LiD5pyIXCIsIFwi5YWr5pyIXCIsIFwi5Lmd5pyIXCIsIFwi5Y2B5pyIXCIsIFwi5Y2B5LiA5pyIXCIsIFwi5Y2B5LqM5pyIXCJdLFxuICAgIHNob3J0TW9udGhzOiBbXCLkuIDmnIhcIiwgXCLkuozmnIhcIiwgXCLkuInmnIhcIiwgXCLlm5vmnIhcIiwgXCLkupTmnIhcIiwgXCLlha3mnIhcIiwgXCLkuIPmnIhcIiwgXCLlhavmnIhcIiwgXCLkuZ3mnIhcIiwgXCLljYHmnIhcIiwgXCLljYHkuIDmnIhcIiwgXCLljYHkuozmnIhcIl1cbiAgfSk7XG5cbiAgdmFyIGlzb1NwZWNpZmllciA9IFwiJVktJW0tJWRUJUg6JU06JVMuJUxaXCI7XG5cbiAgZnVuY3Rpb24gZm9ybWF0SXNvTmF0aXZlKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS50b0lTT1N0cmluZygpO1xuICB9XG5cbiAgZm9ybWF0SXNvTmF0aXZlLnBhcnNlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdHJpbmcpO1xuICAgIHJldHVybiBpc05hTihkYXRlKSA/IG51bGwgOiBkYXRlO1xuICB9O1xuXG4gIGZvcm1hdElzb05hdGl2ZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc29TcGVjaWZpZXI7XG4gIH07XG5cbiAgdmFyIGZvcm1hdElzbyA9IERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nICYmICtuZXcgRGF0ZShcIjIwMDAtMDEtMDFUMDA6MDA6MDAuMDAwWlwiKVxuICAgICAgPyBmb3JtYXRJc29OYXRpdmVcbiAgICAgIDogbG9jYWxlLnV0Y0Zvcm1hdChpc29TcGVjaWZpZXIpO1xuXG4gIHZhciBmb3JtYXQgPSBsb2NhbGUuZm9ybWF0O1xuICB2YXIgdXRjRm9ybWF0ID0gbG9jYWxlLnV0Y0Zvcm1hdDtcblxuICB2YXIgdmVyc2lvbiA9IFwiMC4yLjFcIjtcblxuICBleHBvcnRzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICBleHBvcnRzLmZvcm1hdCA9IGZvcm1hdDtcbiAgZXhwb3J0cy51dGNGb3JtYXQgPSB1dGNGb3JtYXQ7XG4gIGV4cG9ydHMubG9jYWxlID0gbG9jYWxlJDE7XG4gIGV4cG9ydHMubG9jYWxlQ2FFcyA9IGNhRVM7XG4gIGV4cG9ydHMubG9jYWxlRGVDaCA9IGRlQ0g7XG4gIGV4cG9ydHMubG9jYWxlRGVEZSA9IGRlREU7XG4gIGV4cG9ydHMubG9jYWxlRW5DYSA9IGVuQ0E7XG4gIGV4cG9ydHMubG9jYWxlRW5HYiA9IGVuR0I7XG4gIGV4cG9ydHMubG9jYWxlRW5VcyA9IGxvY2FsZTtcbiAgZXhwb3J0cy5sb2NhbGVFc0VzID0gZXNFUztcbiAgZXhwb3J0cy5sb2NhbGVGaUZpID0gZmlGSTtcbiAgZXhwb3J0cy5sb2NhbGVGckNhID0gZnJDQTtcbiAgZXhwb3J0cy5sb2NhbGVGckZyID0gZnJGUjtcbiAgZXhwb3J0cy5sb2NhbGVIZUlsID0gaGVJTDtcbiAgZXhwb3J0cy5sb2NhbGVIdUh1ID0gaHVIVTtcbiAgZXhwb3J0cy5sb2NhbGVJdEl0ID0gaXRJVDtcbiAgZXhwb3J0cy5sb2NhbGVKYUpwID0gamFKUDtcbiAgZXhwb3J0cy5sb2NhbGVLb0tyID0ga29LUjtcbiAgZXhwb3J0cy5sb2NhbGVNa01rID0gbWtNSztcbiAgZXhwb3J0cy5sb2NhbGVObE5sID0gbmxOTDtcbiAgZXhwb3J0cy5sb2NhbGVQbFBsID0gcGxQTDtcbiAgZXhwb3J0cy5sb2NhbGVQdEJyID0gcHRCUjtcbiAgZXhwb3J0cy5sb2NhbGVSdVJ1ID0gcnVSVTtcbiAgZXhwb3J0cy5sb2NhbGVTdlNlID0gc3ZTRTtcbiAgZXhwb3J0cy5sb2NhbGVaaENuID0gemhDTjtcbiAgZXhwb3J0cy5pc29Gb3JtYXQgPSBmb3JtYXRJc287XG5cbn0pKTsiLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKCdkMy10aW1lJywgWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgZmFjdG9yeSgoZ2xvYmFsLmQzX3RpbWUgPSB7fSkpO1xufSh0aGlzLCBmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbiAgdmFyIHQwID0gbmV3IERhdGU7XG4gIHZhciB0MSA9IG5ldyBEYXRlO1xuICBmdW5jdGlvbiBuZXdJbnRlcnZhbChmbG9vcmksIG9mZnNldGksIGNvdW50LCBmaWVsZCkge1xuXG4gICAgZnVuY3Rpb24gaW50ZXJ2YWwoZGF0ZSkge1xuICAgICAgcmV0dXJuIGZsb29yaShkYXRlID0gbmV3IERhdGUoK2RhdGUpKSwgZGF0ZTtcbiAgICB9XG5cbiAgICBpbnRlcnZhbC5mbG9vciA9IGludGVydmFsO1xuXG4gICAgaW50ZXJ2YWwucm91bmQgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgICB2YXIgZDAgPSBuZXcgRGF0ZSgrZGF0ZSksXG4gICAgICAgICAgZDEgPSBuZXcgRGF0ZShkYXRlIC0gMSk7XG4gICAgICBmbG9vcmkoZDApLCBmbG9vcmkoZDEpLCBvZmZzZXRpKGQxLCAxKTtcbiAgICAgIHJldHVybiBkYXRlIC0gZDAgPCBkMSAtIGRhdGUgPyBkMCA6IGQxO1xuICAgIH07XG5cbiAgICBpbnRlcnZhbC5jZWlsID0gZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgcmV0dXJuIGZsb29yaShkYXRlID0gbmV3IERhdGUoZGF0ZSAtIDEpKSwgb2Zmc2V0aShkYXRlLCAxKSwgZGF0ZTtcbiAgICB9O1xuXG4gICAgaW50ZXJ2YWwub2Zmc2V0ID0gZnVuY3Rpb24oZGF0ZSwgc3RlcCkge1xuICAgICAgcmV0dXJuIG9mZnNldGkoZGF0ZSA9IG5ldyBEYXRlKCtkYXRlKSwgc3RlcCA9PSBudWxsID8gMSA6IE1hdGguZmxvb3Ioc3RlcCkpLCBkYXRlO1xuICAgIH07XG5cbiAgICBpbnRlcnZhbC5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgICB2YXIgcmFuZ2UgPSBbXTtcbiAgICAgIHN0YXJ0ID0gbmV3IERhdGUoc3RhcnQgLSAxKTtcbiAgICAgIHN0b3AgPSBuZXcgRGF0ZSgrc3RvcCk7XG4gICAgICBzdGVwID0gc3RlcCA9PSBudWxsID8gMSA6IE1hdGguZmxvb3Ioc3RlcCk7XG4gICAgICBpZiAoIShzdGFydCA8IHN0b3ApIHx8ICEoc3RlcCA+IDApKSByZXR1cm4gcmFuZ2U7IC8vIGFsc28gaGFuZGxlcyBJbnZhbGlkIERhdGVcbiAgICAgIG9mZnNldGkoc3RhcnQsIDEpLCBmbG9vcmkoc3RhcnQpO1xuICAgICAgaWYgKHN0YXJ0IDwgc3RvcCkgcmFuZ2UucHVzaChuZXcgRGF0ZSgrc3RhcnQpKTtcbiAgICAgIHdoaWxlIChvZmZzZXRpKHN0YXJ0LCBzdGVwKSwgZmxvb3JpKHN0YXJ0KSwgc3RhcnQgPCBzdG9wKSByYW5nZS5wdXNoKG5ldyBEYXRlKCtzdGFydCkpO1xuICAgICAgcmV0dXJuIHJhbmdlO1xuICAgIH07XG5cbiAgICBpbnRlcnZhbC5maWx0ZXIgPSBmdW5jdGlvbih0ZXN0KSB7XG4gICAgICByZXR1cm4gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICB3aGlsZSAoZmxvb3JpKGRhdGUpLCAhdGVzdChkYXRlKSkgZGF0ZS5zZXRUaW1lKGRhdGUgLSAxKTtcbiAgICAgIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICAgICAgd2hpbGUgKC0tc3RlcCA+PSAwKSB3aGlsZSAob2Zmc2V0aShkYXRlLCAxKSwgIXRlc3QoZGF0ZSkpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmIChjb3VudCkge1xuICAgICAgaW50ZXJ2YWwuY291bnQgPSBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG4gICAgICAgIHQwLnNldFRpbWUoK3N0YXJ0KSwgdDEuc2V0VGltZSgrZW5kKTtcbiAgICAgICAgZmxvb3JpKHQwKSwgZmxvb3JpKHQxKTtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoY291bnQodDAsIHQxKSk7XG4gICAgICB9O1xuXG4gICAgICBpbnRlcnZhbC5ldmVyeSA9IGZ1bmN0aW9uKHN0ZXApIHtcbiAgICAgICAgc3RlcCA9IE1hdGguZmxvb3Ioc3RlcCk7XG4gICAgICAgIHJldHVybiAhaXNGaW5pdGUoc3RlcCkgfHwgIShzdGVwID4gMCkgPyBudWxsXG4gICAgICAgICAgICA6ICEoc3RlcCA+IDEpID8gaW50ZXJ2YWxcbiAgICAgICAgICAgIDogaW50ZXJ2YWwuZmlsdGVyKGZpZWxkXG4gICAgICAgICAgICAgICAgPyBmdW5jdGlvbihkKSB7IHJldHVybiBmaWVsZChkKSAlIHN0ZXAgPT09IDA7IH1cbiAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGludGVydmFsLmNvdW50KDAsIGQpICUgc3RlcCA9PT0gMDsgfSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBpbnRlcnZhbDtcbiAgfTtcblxuICB2YXIgbWlsbGlzZWNvbmQgPSBuZXdJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAvLyBub29wXG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFRpbWUoK2RhdGUgKyBzdGVwKTtcbiAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBlbmQgLSBzdGFydDtcbiAgfSk7XG5cbiAgLy8gQW4gb3B0aW1pemVkIGltcGxlbWVudGF0aW9uIGZvciB0aGlzIHNpbXBsZSBjYXNlLlxuICBtaWxsaXNlY29uZC5ldmVyeSA9IGZ1bmN0aW9uKGspIHtcbiAgICBrID0gTWF0aC5mbG9vcihrKTtcbiAgICBpZiAoIWlzRmluaXRlKGspIHx8ICEoayA+IDApKSByZXR1cm4gbnVsbDtcbiAgICBpZiAoIShrID4gMSkpIHJldHVybiBtaWxsaXNlY29uZDtcbiAgICByZXR1cm4gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgZGF0ZS5zZXRUaW1lKE1hdGguZmxvb3IoZGF0ZSAvIGspICogayk7XG4gICAgfSwgZnVuY3Rpb24oZGF0ZSwgc3RlcCkge1xuICAgICAgZGF0ZS5zZXRUaW1lKCtkYXRlICsgc3RlcCAqIGspO1xuICAgIH0sIGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiAoZW5kIC0gc3RhcnQpIC8gaztcbiAgICB9KTtcbiAgfTtcblxuICB2YXIgc2Vjb25kID0gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgIGRhdGUuc2V0TWlsbGlzZWNvbmRzKDApO1xuICB9LCBmdW5jdGlvbihkYXRlLCBzdGVwKSB7XG4gICAgZGF0ZS5zZXRUaW1lKCtkYXRlICsgc3RlcCAqIDFlMyk7XG4gIH0sIGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gKGVuZCAtIHN0YXJ0KSAvIDFlMztcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldFNlY29uZHMoKTtcbiAgfSk7XG5cbiAgdmFyIG1pbnV0ZSA9IG5ld0ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgICBkYXRlLnNldFNlY29uZHMoMCwgMCk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFRpbWUoK2RhdGUgKyBzdGVwICogNmU0KTtcbiAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiAoZW5kIC0gc3RhcnQpIC8gNmU0O1xuICB9LCBmdW5jdGlvbihkYXRlKSB7XG4gICAgcmV0dXJuIGRhdGUuZ2V0TWludXRlcygpO1xuICB9KTtcblxuICB2YXIgaG91ciA9IG5ld0ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgICBkYXRlLnNldE1pbnV0ZXMoMCwgMCwgMCk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFRpbWUoK2RhdGUgKyBzdGVwICogMzZlNSk7XG4gIH0sIGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gKGVuZCAtIHN0YXJ0KSAvIDM2ZTU7XG4gIH0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS5nZXRIb3VycygpO1xuICB9KTtcblxuICB2YXIgZGF5ID0gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgIGRhdGUuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyBzdGVwKTtcbiAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiAoZW5kIC0gc3RhcnQgLSAoZW5kLmdldFRpbWV6b25lT2Zmc2V0KCkgLSBzdGFydC5nZXRUaW1lem9uZU9mZnNldCgpKSAqIDZlNCkgLyA4NjRlNTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldERhdGUoKSAtIDE7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHdlZWtkYXkoaSkge1xuICAgIHJldHVybiBuZXdJbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gICAgICBkYXRlLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpIC0gKGRhdGUuZ2V0RGF5KCkgKyA3IC0gaSkgJSA3KTtcbiAgICB9LCBmdW5jdGlvbihkYXRlLCBzdGVwKSB7XG4gICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyBzdGVwICogNyk7XG4gICAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgICAgcmV0dXJuIChlbmQgLSBzdGFydCAtIChlbmQuZ2V0VGltZXpvbmVPZmZzZXQoKSAtIHN0YXJ0LmdldFRpbWV6b25lT2Zmc2V0KCkpICogNmU0KSAvIDYwNDhlNTtcbiAgICB9KTtcbiAgfVxuXG4gIHZhciBzdW5kYXkgPSB3ZWVrZGF5KDApO1xuICB2YXIgbW9uZGF5ID0gd2Vla2RheSgxKTtcbiAgdmFyIHR1ZXNkYXkgPSB3ZWVrZGF5KDIpO1xuICB2YXIgd2VkbmVzZGF5ID0gd2Vla2RheSgzKTtcbiAgdmFyIHRodXJzZGF5ID0gd2Vla2RheSg0KTtcbiAgdmFyIGZyaWRheSA9IHdlZWtkYXkoNSk7XG4gIHZhciBzYXR1cmRheSA9IHdlZWtkYXkoNik7XG5cbiAgdmFyIG1vbnRoID0gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgIGRhdGUuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgZGF0ZS5zZXREYXRlKDEpO1xuICB9LCBmdW5jdGlvbihkYXRlLCBzdGVwKSB7XG4gICAgZGF0ZS5zZXRNb250aChkYXRlLmdldE1vbnRoKCkgKyBzdGVwKTtcbiAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBlbmQuZ2V0TW9udGgoKSAtIHN0YXJ0LmdldE1vbnRoKCkgKyAoZW5kLmdldEZ1bGxZZWFyKCkgLSBzdGFydC5nZXRGdWxsWWVhcigpKSAqIDEyO1xuICB9LCBmdW5jdGlvbihkYXRlKSB7XG4gICAgcmV0dXJuIGRhdGUuZ2V0TW9udGgoKTtcbiAgfSk7XG5cbiAgdmFyIHllYXIgPSBuZXdJbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gICAgZGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICBkYXRlLnNldE1vbnRoKDAsIDEpO1xuICB9LCBmdW5jdGlvbihkYXRlLCBzdGVwKSB7XG4gICAgZGF0ZS5zZXRGdWxsWWVhcihkYXRlLmdldEZ1bGxZZWFyKCkgKyBzdGVwKTtcbiAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBlbmQuZ2V0RnVsbFllYXIoKSAtIHN0YXJ0LmdldEZ1bGxZZWFyKCk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS5nZXRGdWxsWWVhcigpO1xuICB9KTtcblxuICB2YXIgdXRjU2Vjb25kID0gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgIGRhdGUuc2V0VVRDTWlsbGlzZWNvbmRzKDApO1xuICB9LCBmdW5jdGlvbihkYXRlLCBzdGVwKSB7XG4gICAgZGF0ZS5zZXRUaW1lKCtkYXRlICsgc3RlcCAqIDFlMyk7XG4gIH0sIGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gKGVuZCAtIHN0YXJ0KSAvIDFlMztcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldFVUQ1NlY29uZHMoKTtcbiAgfSk7XG5cbiAgdmFyIHV0Y01pbnV0ZSA9IG5ld0ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgICBkYXRlLnNldFVUQ1NlY29uZHMoMCwgMCk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFRpbWUoK2RhdGUgKyBzdGVwICogNmU0KTtcbiAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiAoZW5kIC0gc3RhcnQpIC8gNmU0O1xuICB9LCBmdW5jdGlvbihkYXRlKSB7XG4gICAgcmV0dXJuIGRhdGUuZ2V0VVRDTWludXRlcygpO1xuICB9KTtcblxuICB2YXIgdXRjSG91ciA9IG5ld0ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgICBkYXRlLnNldFVUQ01pbnV0ZXMoMCwgMCwgMCk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFRpbWUoK2RhdGUgKyBzdGVwICogMzZlNSk7XG4gIH0sIGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gKGVuZCAtIHN0YXJ0KSAvIDM2ZTU7XG4gIH0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENIb3VycygpO1xuICB9KTtcblxuICB2YXIgdXRjRGF5ID0gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgIGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFVUQ0RhdGUoZGF0ZS5nZXRVVENEYXRlKCkgKyBzdGVwKTtcbiAgfSwgZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiAoZW5kIC0gc3RhcnQpIC8gODY0ZTU7XG4gIH0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENEYXRlKCkgLSAxO1xuICB9KTtcblxuICBmdW5jdGlvbiB1dGNXZWVrZGF5KGkpIHtcbiAgICByZXR1cm4gbmV3SW50ZXJ2YWwoZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgZGF0ZS5zZXRVVENIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgIGRhdGUuc2V0VVRDRGF0ZShkYXRlLmdldFVUQ0RhdGUoKSAtIChkYXRlLmdldFVUQ0RheSgpICsgNyAtIGkpICUgNyk7XG4gICAgfSwgZnVuY3Rpb24oZGF0ZSwgc3RlcCkge1xuICAgICAgZGF0ZS5zZXRVVENEYXRlKGRhdGUuZ2V0VVRDRGF0ZSgpICsgc3RlcCAqIDcpO1xuICAgIH0sIGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiAoZW5kIC0gc3RhcnQpIC8gNjA0OGU1O1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIHV0Y1N1bmRheSA9IHV0Y1dlZWtkYXkoMCk7XG4gIHZhciB1dGNNb25kYXkgPSB1dGNXZWVrZGF5KDEpO1xuICB2YXIgdXRjVHVlc2RheSA9IHV0Y1dlZWtkYXkoMik7XG4gIHZhciB1dGNXZWRuZXNkYXkgPSB1dGNXZWVrZGF5KDMpO1xuICB2YXIgdXRjVGh1cnNkYXkgPSB1dGNXZWVrZGF5KDQpO1xuICB2YXIgdXRjRnJpZGF5ID0gdXRjV2Vla2RheSg1KTtcbiAgdmFyIHV0Y1NhdHVyZGF5ID0gdXRjV2Vla2RheSg2KTtcblxuICB2YXIgdXRjTW9udGggPSBuZXdJbnRlcnZhbChmdW5jdGlvbihkYXRlKSB7XG4gICAgZGF0ZS5zZXRVVENIb3VycygwLCAwLCAwLCAwKTtcbiAgICBkYXRlLnNldFVUQ0RhdGUoMSk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFVUQ01vbnRoKGRhdGUuZ2V0VVRDTW9udGgoKSArIHN0ZXApO1xuICB9LCBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGVuZC5nZXRVVENNb250aCgpIC0gc3RhcnQuZ2V0VVRDTW9udGgoKSArIChlbmQuZ2V0VVRDRnVsbFllYXIoKSAtIHN0YXJ0LmdldFVUQ0Z1bGxZZWFyKCkpICogMTI7XG4gIH0sIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENNb250aCgpO1xuICB9KTtcblxuICB2YXIgdXRjWWVhciA9IG5ld0ludGVydmFsKGZ1bmN0aW9uKGRhdGUpIHtcbiAgICBkYXRlLnNldFVUQ0hvdXJzKDAsIDAsIDAsIDApO1xuICAgIGRhdGUuc2V0VVRDTW9udGgoMCwgMSk7XG4gIH0sIGZ1bmN0aW9uKGRhdGUsIHN0ZXApIHtcbiAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSArIHN0ZXApO1xuICB9LCBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGVuZC5nZXRVVENGdWxsWWVhcigpIC0gc3RhcnQuZ2V0VVRDRnVsbFllYXIoKTtcbiAgfSwgZnVuY3Rpb24oZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLmdldFVUQ0Z1bGxZZWFyKCk7XG4gIH0pO1xuXG4gIHZhciBtaWxsaXNlY29uZHMgPSBtaWxsaXNlY29uZC5yYW5nZTtcbiAgdmFyIHNlY29uZHMgPSBzZWNvbmQucmFuZ2U7XG4gIHZhciBtaW51dGVzID0gbWludXRlLnJhbmdlO1xuICB2YXIgaG91cnMgPSBob3VyLnJhbmdlO1xuICB2YXIgZGF5cyA9IGRheS5yYW5nZTtcbiAgdmFyIHN1bmRheXMgPSBzdW5kYXkucmFuZ2U7XG4gIHZhciBtb25kYXlzID0gbW9uZGF5LnJhbmdlO1xuICB2YXIgdHVlc2RheXMgPSB0dWVzZGF5LnJhbmdlO1xuICB2YXIgd2VkbmVzZGF5cyA9IHdlZG5lc2RheS5yYW5nZTtcbiAgdmFyIHRodXJzZGF5cyA9IHRodXJzZGF5LnJhbmdlO1xuICB2YXIgZnJpZGF5cyA9IGZyaWRheS5yYW5nZTtcbiAgdmFyIHNhdHVyZGF5cyA9IHNhdHVyZGF5LnJhbmdlO1xuICB2YXIgd2Vla3MgPSBzdW5kYXkucmFuZ2U7XG4gIHZhciBtb250aHMgPSBtb250aC5yYW5nZTtcbiAgdmFyIHllYXJzID0geWVhci5yYW5nZTtcblxuICB2YXIgdXRjTWlsbGlzZWNvbmQgPSBtaWxsaXNlY29uZDtcbiAgdmFyIHV0Y01pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcztcbiAgdmFyIHV0Y1NlY29uZHMgPSB1dGNTZWNvbmQucmFuZ2U7XG4gIHZhciB1dGNNaW51dGVzID0gdXRjTWludXRlLnJhbmdlO1xuICB2YXIgdXRjSG91cnMgPSB1dGNIb3VyLnJhbmdlO1xuICB2YXIgdXRjRGF5cyA9IHV0Y0RheS5yYW5nZTtcbiAgdmFyIHV0Y1N1bmRheXMgPSB1dGNTdW5kYXkucmFuZ2U7XG4gIHZhciB1dGNNb25kYXlzID0gdXRjTW9uZGF5LnJhbmdlO1xuICB2YXIgdXRjVHVlc2RheXMgPSB1dGNUdWVzZGF5LnJhbmdlO1xuICB2YXIgdXRjV2VkbmVzZGF5cyA9IHV0Y1dlZG5lc2RheS5yYW5nZTtcbiAgdmFyIHV0Y1RodXJzZGF5cyA9IHV0Y1RodXJzZGF5LnJhbmdlO1xuICB2YXIgdXRjRnJpZGF5cyA9IHV0Y0ZyaWRheS5yYW5nZTtcbiAgdmFyIHV0Y1NhdHVyZGF5cyA9IHV0Y1NhdHVyZGF5LnJhbmdlO1xuICB2YXIgdXRjV2Vla3MgPSB1dGNTdW5kYXkucmFuZ2U7XG4gIHZhciB1dGNNb250aHMgPSB1dGNNb250aC5yYW5nZTtcbiAgdmFyIHV0Y1llYXJzID0gdXRjWWVhci5yYW5nZTtcblxuICB2YXIgdmVyc2lvbiA9IFwiMC4xLjFcIjtcblxuICBleHBvcnRzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICBleHBvcnRzLm1pbGxpc2Vjb25kcyA9IG1pbGxpc2Vjb25kcztcbiAgZXhwb3J0cy5zZWNvbmRzID0gc2Vjb25kcztcbiAgZXhwb3J0cy5taW51dGVzID0gbWludXRlcztcbiAgZXhwb3J0cy5ob3VycyA9IGhvdXJzO1xuICBleHBvcnRzLmRheXMgPSBkYXlzO1xuICBleHBvcnRzLnN1bmRheXMgPSBzdW5kYXlzO1xuICBleHBvcnRzLm1vbmRheXMgPSBtb25kYXlzO1xuICBleHBvcnRzLnR1ZXNkYXlzID0gdHVlc2RheXM7XG4gIGV4cG9ydHMud2VkbmVzZGF5cyA9IHdlZG5lc2RheXM7XG4gIGV4cG9ydHMudGh1cnNkYXlzID0gdGh1cnNkYXlzO1xuICBleHBvcnRzLmZyaWRheXMgPSBmcmlkYXlzO1xuICBleHBvcnRzLnNhdHVyZGF5cyA9IHNhdHVyZGF5cztcbiAgZXhwb3J0cy53ZWVrcyA9IHdlZWtzO1xuICBleHBvcnRzLm1vbnRocyA9IG1vbnRocztcbiAgZXhwb3J0cy55ZWFycyA9IHllYXJzO1xuICBleHBvcnRzLnV0Y01pbGxpc2Vjb25kID0gdXRjTWlsbGlzZWNvbmQ7XG4gIGV4cG9ydHMudXRjTWlsbGlzZWNvbmRzID0gdXRjTWlsbGlzZWNvbmRzO1xuICBleHBvcnRzLnV0Y1NlY29uZHMgPSB1dGNTZWNvbmRzO1xuICBleHBvcnRzLnV0Y01pbnV0ZXMgPSB1dGNNaW51dGVzO1xuICBleHBvcnRzLnV0Y0hvdXJzID0gdXRjSG91cnM7XG4gIGV4cG9ydHMudXRjRGF5cyA9IHV0Y0RheXM7XG4gIGV4cG9ydHMudXRjU3VuZGF5cyA9IHV0Y1N1bmRheXM7XG4gIGV4cG9ydHMudXRjTW9uZGF5cyA9IHV0Y01vbmRheXM7XG4gIGV4cG9ydHMudXRjVHVlc2RheXMgPSB1dGNUdWVzZGF5cztcbiAgZXhwb3J0cy51dGNXZWRuZXNkYXlzID0gdXRjV2VkbmVzZGF5cztcbiAgZXhwb3J0cy51dGNUaHVyc2RheXMgPSB1dGNUaHVyc2RheXM7XG4gIGV4cG9ydHMudXRjRnJpZGF5cyA9IHV0Y0ZyaWRheXM7XG4gIGV4cG9ydHMudXRjU2F0dXJkYXlzID0gdXRjU2F0dXJkYXlzO1xuICBleHBvcnRzLnV0Y1dlZWtzID0gdXRjV2Vla3M7XG4gIGV4cG9ydHMudXRjTW9udGhzID0gdXRjTW9udGhzO1xuICBleHBvcnRzLnV0Y1llYXJzID0gdXRjWWVhcnM7XG4gIGV4cG9ydHMubWlsbGlzZWNvbmQgPSBtaWxsaXNlY29uZDtcbiAgZXhwb3J0cy5zZWNvbmQgPSBzZWNvbmQ7XG4gIGV4cG9ydHMubWludXRlID0gbWludXRlO1xuICBleHBvcnRzLmhvdXIgPSBob3VyO1xuICBleHBvcnRzLmRheSA9IGRheTtcbiAgZXhwb3J0cy5zdW5kYXkgPSBzdW5kYXk7XG4gIGV4cG9ydHMubW9uZGF5ID0gbW9uZGF5O1xuICBleHBvcnRzLnR1ZXNkYXkgPSB0dWVzZGF5O1xuICBleHBvcnRzLndlZG5lc2RheSA9IHdlZG5lc2RheTtcbiAgZXhwb3J0cy50aHVyc2RheSA9IHRodXJzZGF5O1xuICBleHBvcnRzLmZyaWRheSA9IGZyaWRheTtcbiAgZXhwb3J0cy5zYXR1cmRheSA9IHNhdHVyZGF5O1xuICBleHBvcnRzLndlZWsgPSBzdW5kYXk7XG4gIGV4cG9ydHMubW9udGggPSBtb250aDtcbiAgZXhwb3J0cy55ZWFyID0geWVhcjtcbiAgZXhwb3J0cy51dGNTZWNvbmQgPSB1dGNTZWNvbmQ7XG4gIGV4cG9ydHMudXRjTWludXRlID0gdXRjTWludXRlO1xuICBleHBvcnRzLnV0Y0hvdXIgPSB1dGNIb3VyO1xuICBleHBvcnRzLnV0Y0RheSA9IHV0Y0RheTtcbiAgZXhwb3J0cy51dGNTdW5kYXkgPSB1dGNTdW5kYXk7XG4gIGV4cG9ydHMudXRjTW9uZGF5ID0gdXRjTW9uZGF5O1xuICBleHBvcnRzLnV0Y1R1ZXNkYXkgPSB1dGNUdWVzZGF5O1xuICBleHBvcnRzLnV0Y1dlZG5lc2RheSA9IHV0Y1dlZG5lc2RheTtcbiAgZXhwb3J0cy51dGNUaHVyc2RheSA9IHV0Y1RodXJzZGF5O1xuICBleHBvcnRzLnV0Y0ZyaWRheSA9IHV0Y0ZyaWRheTtcbiAgZXhwb3J0cy51dGNTYXR1cmRheSA9IHV0Y1NhdHVyZGF5O1xuICBleHBvcnRzLnV0Y1dlZWsgPSB1dGNTdW5kYXk7XG4gIGV4cG9ydHMudXRjTW9udGggPSB1dGNNb250aDtcbiAgZXhwb3J0cy51dGNZZWFyID0gdXRjWWVhcjtcbiAgZXhwb3J0cy5pbnRlcnZhbCA9IG5ld0ludGVydmFsO1xuXG59KSk7IiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgoZ2xvYmFsLnRvcG9qc29uID0ge30pKSk7XG59KHRoaXMsIGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiBub29wKCkge31cblxuICBmdW5jdGlvbiBhYnNvbHV0ZSh0cmFuc2Zvcm0pIHtcbiAgICBpZiAoIXRyYW5zZm9ybSkgcmV0dXJuIG5vb3A7XG4gICAgdmFyIHgwLFxuICAgICAgICB5MCxcbiAgICAgICAga3ggPSB0cmFuc2Zvcm0uc2NhbGVbMF0sXG4gICAgICAgIGt5ID0gdHJhbnNmb3JtLnNjYWxlWzFdLFxuICAgICAgICBkeCA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMF0sXG4gICAgICAgIGR5ID0gdHJhbnNmb3JtLnRyYW5zbGF0ZVsxXTtcbiAgICByZXR1cm4gZnVuY3Rpb24ocG9pbnQsIGkpIHtcbiAgICAgIGlmICghaSkgeDAgPSB5MCA9IDA7XG4gICAgICBwb2ludFswXSA9ICh4MCArPSBwb2ludFswXSkgKiBreCArIGR4O1xuICAgICAgcG9pbnRbMV0gPSAoeTAgKz0gcG9pbnRbMV0pICoga3kgKyBkeTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVsYXRpdmUodHJhbnNmb3JtKSB7XG4gICAgaWYgKCF0cmFuc2Zvcm0pIHJldHVybiBub29wO1xuICAgIHZhciB4MCxcbiAgICAgICAgeTAsXG4gICAgICAgIGt4ID0gdHJhbnNmb3JtLnNjYWxlWzBdLFxuICAgICAgICBreSA9IHRyYW5zZm9ybS5zY2FsZVsxXSxcbiAgICAgICAgZHggPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzBdLFxuICAgICAgICBkeSA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHBvaW50LCBpKSB7XG4gICAgICBpZiAoIWkpIHgwID0geTAgPSAwO1xuICAgICAgdmFyIHgxID0gKHBvaW50WzBdIC0gZHgpIC8ga3ggfCAwLFxuICAgICAgICAgIHkxID0gKHBvaW50WzFdIC0gZHkpIC8ga3kgfCAwO1xuICAgICAgcG9pbnRbMF0gPSB4MSAtIHgwO1xuICAgICAgcG9pbnRbMV0gPSB5MSAtIHkwO1xuICAgICAgeDAgPSB4MTtcbiAgICAgIHkwID0geTE7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJldmVyc2UoYXJyYXksIG4pIHtcbiAgICB2YXIgdCwgaiA9IGFycmF5Lmxlbmd0aCwgaSA9IGogLSBuO1xuICAgIHdoaWxlIChpIDwgLS1qKSB0ID0gYXJyYXlbaV0sIGFycmF5W2krK10gPSBhcnJheVtqXSwgYXJyYXlbal0gPSB0O1xuICB9XG5cbiAgZnVuY3Rpb24gYmlzZWN0KGEsIHgpIHtcbiAgICB2YXIgbG8gPSAwLCBoaSA9IGEubGVuZ3RoO1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmIChhW21pZF0gPCB4KSBsbyA9IG1pZCArIDE7XG4gICAgICBlbHNlIGhpID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBmdW5jdGlvbiBmZWF0dXJlKHRvcG9sb2d5LCBvKSB7XG4gICAgcmV0dXJuIG8udHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiA/IHtcbiAgICAgIHR5cGU6IFwiRmVhdHVyZUNvbGxlY3Rpb25cIixcbiAgICAgIGZlYXR1cmVzOiBvLmdlb21ldHJpZXMubWFwKGZ1bmN0aW9uKG8pIHsgcmV0dXJuIGZlYXR1cmUkMSh0b3BvbG9neSwgbyk7IH0pXG4gICAgfSA6IGZlYXR1cmUkMSh0b3BvbG9neSwgbyk7XG4gIH1cblxuICBmdW5jdGlvbiBmZWF0dXJlJDEodG9wb2xvZ3ksIG8pIHtcbiAgICB2YXIgZiA9IHtcbiAgICAgIHR5cGU6IFwiRmVhdHVyZVwiLFxuICAgICAgaWQ6IG8uaWQsXG4gICAgICBwcm9wZXJ0aWVzOiBvLnByb3BlcnRpZXMgfHwge30sXG4gICAgICBnZW9tZXRyeTogb2JqZWN0KHRvcG9sb2d5LCBvKVxuICAgIH07XG4gICAgaWYgKG8uaWQgPT0gbnVsbCkgZGVsZXRlIGYuaWQ7XG4gICAgcmV0dXJuIGY7XG4gIH1cblxuICBmdW5jdGlvbiBvYmplY3QodG9wb2xvZ3ksIG8pIHtcbiAgICB2YXIgYWJzb2x1dGUkJCA9IGFic29sdXRlKHRvcG9sb2d5LnRyYW5zZm9ybSksXG4gICAgICAgIGFyY3MgPSB0b3BvbG9neS5hcmNzO1xuXG4gICAgZnVuY3Rpb24gYXJjKGksIHBvaW50cykge1xuICAgICAgaWYgKHBvaW50cy5sZW5ndGgpIHBvaW50cy5wb3AoKTtcbiAgICAgIGZvciAodmFyIGEgPSBhcmNzW2kgPCAwID8gfmkgOiBpXSwgayA9IDAsIG4gPSBhLmxlbmd0aCwgcDsgayA8IG47ICsraykge1xuICAgICAgICBwb2ludHMucHVzaChwID0gYVtrXS5zbGljZSgpKTtcbiAgICAgICAgYWJzb2x1dGUkJChwLCBrKTtcbiAgICAgIH1cbiAgICAgIGlmIChpIDwgMCkgcmV2ZXJzZShwb2ludHMsIG4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvaW50KHApIHtcbiAgICAgIHAgPSBwLnNsaWNlKCk7XG4gICAgICBhYnNvbHV0ZSQkKHAsIDApO1xuICAgICAgcmV0dXJuIHA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGluZShhcmNzKSB7XG4gICAgICB2YXIgcG9pbnRzID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSBhcmMoYXJjc1tpXSwgcG9pbnRzKTtcbiAgICAgIGlmIChwb2ludHMubGVuZ3RoIDwgMikgcG9pbnRzLnB1c2gocG9pbnRzWzBdLnNsaWNlKCkpO1xuICAgICAgcmV0dXJuIHBvaW50cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByaW5nKGFyY3MpIHtcbiAgICAgIHZhciBwb2ludHMgPSBsaW5lKGFyY3MpO1xuICAgICAgd2hpbGUgKHBvaW50cy5sZW5ndGggPCA0KSBwb2ludHMucHVzaChwb2ludHNbMF0uc2xpY2UoKSk7XG4gICAgICByZXR1cm4gcG9pbnRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvbHlnb24oYXJjcykge1xuICAgICAgcmV0dXJuIGFyY3MubWFwKHJpbmcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlb21ldHJ5KG8pIHtcbiAgICAgIHZhciB0ID0gby50eXBlO1xuICAgICAgcmV0dXJuIHQgPT09IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIgPyB7dHlwZTogdCwgZ2VvbWV0cmllczogby5nZW9tZXRyaWVzLm1hcChnZW9tZXRyeSl9XG4gICAgICAgICAgOiB0IGluIGdlb21ldHJ5VHlwZSA/IHt0eXBlOiB0LCBjb29yZGluYXRlczogZ2VvbWV0cnlUeXBlW3RdKG8pfVxuICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZ2VvbWV0cnlUeXBlID0ge1xuICAgICAgUG9pbnQ6IGZ1bmN0aW9uKG8pIHsgcmV0dXJuIHBvaW50KG8uY29vcmRpbmF0ZXMpOyB9LFxuICAgICAgTXVsdGlQb2ludDogZnVuY3Rpb24obykgeyByZXR1cm4gby5jb29yZGluYXRlcy5tYXAocG9pbnQpOyB9LFxuICAgICAgTGluZVN0cmluZzogZnVuY3Rpb24obykgeyByZXR1cm4gbGluZShvLmFyY3MpOyB9LFxuICAgICAgTXVsdGlMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IHJldHVybiBvLmFyY3MubWFwKGxpbmUpOyB9LFxuICAgICAgUG9seWdvbjogZnVuY3Rpb24obykgeyByZXR1cm4gcG9seWdvbihvLmFyY3MpOyB9LFxuICAgICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihvKSB7IHJldHVybiBvLmFyY3MubWFwKHBvbHlnb24pOyB9XG4gICAgfTtcblxuICAgIHJldHVybiBnZW9tZXRyeShvKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN0aXRjaEFyY3ModG9wb2xvZ3ksIGFyY3MpIHtcbiAgICB2YXIgc3RpdGNoZWRBcmNzID0ge30sXG4gICAgICAgIGZyYWdtZW50QnlTdGFydCA9IHt9LFxuICAgICAgICBmcmFnbWVudEJ5RW5kID0ge30sXG4gICAgICAgIGZyYWdtZW50cyA9IFtdLFxuICAgICAgICBlbXB0eUluZGV4ID0gLTE7XG5cbiAgICAvLyBTdGl0Y2ggZW1wdHkgYXJjcyBmaXJzdCwgc2luY2UgdGhleSBtYXkgYmUgc3Vic3VtZWQgYnkgb3RoZXIgYXJjcy5cbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSwgaikge1xuICAgICAgdmFyIGFyYyA9IHRvcG9sb2d5LmFyY3NbaSA8IDAgPyB+aSA6IGldLCB0O1xuICAgICAgaWYgKGFyYy5sZW5ndGggPCAzICYmICFhcmNbMV1bMF0gJiYgIWFyY1sxXVsxXSkge1xuICAgICAgICB0ID0gYXJjc1srK2VtcHR5SW5kZXhdLCBhcmNzW2VtcHR5SW5kZXhdID0gaSwgYXJjc1tqXSA9IHQ7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgdmFyIGUgPSBlbmRzKGkpLFxuICAgICAgICAgIHN0YXJ0ID0gZVswXSxcbiAgICAgICAgICBlbmQgPSBlWzFdLFxuICAgICAgICAgIGYsIGc7XG5cbiAgICAgIGlmIChmID0gZnJhZ21lbnRCeUVuZFtzdGFydF0pIHtcbiAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlFbmRbZi5lbmRdO1xuICAgICAgICBmLnB1c2goaSk7XG4gICAgICAgIGYuZW5kID0gZW5kO1xuICAgICAgICBpZiAoZyA9IGZyYWdtZW50QnlTdGFydFtlbmRdKSB7XG4gICAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlTdGFydFtnLnN0YXJ0XTtcbiAgICAgICAgICB2YXIgZmcgPSBnID09PSBmID8gZiA6IGYuY29uY2F0KGcpO1xuICAgICAgICAgIGZyYWdtZW50QnlTdGFydFtmZy5zdGFydCA9IGYuc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtmZy5lbmQgPSBnLmVuZF0gPSBmZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2YuZW5kXSA9IGY7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZiA9IGZyYWdtZW50QnlTdGFydFtlbmRdKSB7XG4gICAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF07XG4gICAgICAgIGYudW5zaGlmdChpKTtcbiAgICAgICAgZi5zdGFydCA9IHN0YXJ0O1xuICAgICAgICBpZiAoZyA9IGZyYWdtZW50QnlFbmRbc3RhcnRdKSB7XG4gICAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlFbmRbZy5lbmRdO1xuICAgICAgICAgIHZhciBnZiA9IGcgPT09IGYgPyBmIDogZy5jb25jYXQoZik7XG4gICAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2dmLnN0YXJ0ID0gZy5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2dmLmVuZCA9IGYuZW5kXSA9IGdmO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZi5lbmRdID0gZjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZiA9IFtpXTtcbiAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnQgPSBzdGFydF0gPSBmcmFnbWVudEJ5RW5kW2YuZW5kID0gZW5kXSA9IGY7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBlbmRzKGkpIHtcbiAgICAgIHZhciBhcmMgPSB0b3BvbG9neS5hcmNzW2kgPCAwID8gfmkgOiBpXSwgcDAgPSBhcmNbMF0sIHAxO1xuICAgICAgaWYgKHRvcG9sb2d5LnRyYW5zZm9ybSkgcDEgPSBbMCwgMF0sIGFyYy5mb3JFYWNoKGZ1bmN0aW9uKGRwKSB7IHAxWzBdICs9IGRwWzBdLCBwMVsxXSArPSBkcFsxXTsgfSk7XG4gICAgICBlbHNlIHAxID0gYXJjW2FyYy5sZW5ndGggLSAxXTtcbiAgICAgIHJldHVybiBpIDwgMCA/IFtwMSwgcDBdIDogW3AwLCBwMV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmx1c2goZnJhZ21lbnRCeUVuZCwgZnJhZ21lbnRCeVN0YXJ0KSB7XG4gICAgICBmb3IgKHZhciBrIGluIGZyYWdtZW50QnlFbmQpIHtcbiAgICAgICAgdmFyIGYgPSBmcmFnbWVudEJ5RW5kW2tdO1xuICAgICAgICBkZWxldGUgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnRdO1xuICAgICAgICBkZWxldGUgZi5zdGFydDtcbiAgICAgICAgZGVsZXRlIGYuZW5kO1xuICAgICAgICBmLmZvckVhY2goZnVuY3Rpb24oaSkgeyBzdGl0Y2hlZEFyY3NbaSA8IDAgPyB+aSA6IGldID0gMTsgfSk7XG4gICAgICAgIGZyYWdtZW50cy5wdXNoKGYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZsdXNoKGZyYWdtZW50QnlFbmQsIGZyYWdtZW50QnlTdGFydCk7XG4gICAgZmx1c2goZnJhZ21lbnRCeVN0YXJ0LCBmcmFnbWVudEJ5RW5kKTtcbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSkgeyBpZiAoIXN0aXRjaGVkQXJjc1tpIDwgMCA/IH5pIDogaV0pIGZyYWdtZW50cy5wdXNoKFtpXSk7IH0pO1xuXG4gICAgcmV0dXJuIGZyYWdtZW50cztcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lc2godG9wb2xvZ3kpIHtcbiAgICByZXR1cm4gb2JqZWN0KHRvcG9sb2d5LCBtZXNoQXJjcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lc2hBcmNzKHRvcG9sb2d5LCBvLCBmaWx0ZXIpIHtcbiAgICB2YXIgYXJjcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gYXJjKGkpIHtcbiAgICAgIHZhciBqID0gaSA8IDAgPyB+aSA6IGk7XG4gICAgICAoZ2VvbXNCeUFyY1tqXSB8fCAoZ2VvbXNCeUFyY1tqXSA9IFtdKSkucHVzaCh7aTogaSwgZzogZ2VvbX0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpbmUoYXJjcykge1xuICAgICAgYXJjcy5mb3JFYWNoKGFyYyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9seWdvbihhcmNzKSB7XG4gICAgICBhcmNzLmZvckVhY2gobGluZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VvbWV0cnkobykge1xuICAgICAgaWYgKG8udHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIikgby5nZW9tZXRyaWVzLmZvckVhY2goZ2VvbWV0cnkpO1xuICAgICAgZWxzZSBpZiAoby50eXBlIGluIGdlb21ldHJ5VHlwZSkgZ2VvbSA9IG8sIGdlb21ldHJ5VHlwZVtvLnR5cGVdKG8uYXJjcyk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICB2YXIgZ2VvbXNCeUFyYyA9IFtdLFxuICAgICAgICAgIGdlb207XG5cbiAgICAgIHZhciBnZW9tZXRyeVR5cGUgPSB7XG4gICAgICAgIExpbmVTdHJpbmc6IGxpbmUsXG4gICAgICAgIE11bHRpTGluZVN0cmluZzogcG9seWdvbixcbiAgICAgICAgUG9seWdvbjogcG9seWdvbixcbiAgICAgICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihhcmNzKSB7IGFyY3MuZm9yRWFjaChwb2x5Z29uKTsgfVxuICAgICAgfTtcblxuICAgICAgZ2VvbWV0cnkobyk7XG5cbiAgICAgIGdlb21zQnlBcmMuZm9yRWFjaChhcmd1bWVudHMubGVuZ3RoIDwgM1xuICAgICAgICAgID8gZnVuY3Rpb24oZ2VvbXMpIHsgYXJjcy5wdXNoKGdlb21zWzBdLmkpOyB9XG4gICAgICAgICAgOiBmdW5jdGlvbihnZW9tcykgeyBpZiAoZmlsdGVyKGdlb21zWzBdLmcsIGdlb21zW2dlb21zLmxlbmd0aCAtIDFdLmcpKSBhcmNzLnB1c2goZ2VvbXNbMF0uaSk7IH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbiA9IHRvcG9sb2d5LmFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSBhcmNzLnB1c2goaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHt0eXBlOiBcIk11bHRpTGluZVN0cmluZ1wiLCBhcmNzOiBzdGl0Y2hBcmNzKHRvcG9sb2d5LCBhcmNzKX07XG4gIH1cblxuICBmdW5jdGlvbiB0cmlhbmdsZSh0cmlhbmdsZSkge1xuICAgIHZhciBhID0gdHJpYW5nbGVbMF0sIGIgPSB0cmlhbmdsZVsxXSwgYyA9IHRyaWFuZ2xlWzJdO1xuICAgIHJldHVybiBNYXRoLmFicygoYVswXSAtIGNbMF0pICogKGJbMV0gLSBhWzFdKSAtIChhWzBdIC0gYlswXSkgKiAoY1sxXSAtIGFbMV0pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJpbmcocmluZykge1xuICAgIHZhciBpID0gLTEsXG4gICAgICAgIG4gPSByaW5nLmxlbmd0aCxcbiAgICAgICAgYSxcbiAgICAgICAgYiA9IHJpbmdbbiAtIDFdLFxuICAgICAgICBhcmVhID0gMDtcblxuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBhID0gYjtcbiAgICAgIGIgPSByaW5nW2ldO1xuICAgICAgYXJlYSArPSBhWzBdICogYlsxXSAtIGFbMV0gKiBiWzBdO1xuICAgIH1cblxuICAgIHJldHVybiBhcmVhIC8gMjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lcmdlKHRvcG9sb2d5KSB7XG4gICAgcmV0dXJuIG9iamVjdCh0b3BvbG9neSwgbWVyZ2VBcmNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VBcmNzKHRvcG9sb2d5LCBvYmplY3RzKSB7XG4gICAgdmFyIHBvbHlnb25zQnlBcmMgPSB7fSxcbiAgICAgICAgcG9seWdvbnMgPSBbXSxcbiAgICAgICAgY29tcG9uZW50cyA9IFtdO1xuXG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKG8pIHtcbiAgICAgIGlmIChvLnR5cGUgPT09IFwiUG9seWdvblwiKSByZWdpc3RlcihvLmFyY3MpO1xuICAgICAgZWxzZSBpZiAoby50eXBlID09PSBcIk11bHRpUG9seWdvblwiKSBvLmFyY3MuZm9yRWFjaChyZWdpc3Rlcik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByZWdpc3Rlcihwb2x5Z29uKSB7XG4gICAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZyQkKSB7XG4gICAgICAgIHJpbmckJC5mb3JFYWNoKGZ1bmN0aW9uKGFyYykge1xuICAgICAgICAgIChwb2x5Z29uc0J5QXJjW2FyYyA9IGFyYyA8IDAgPyB+YXJjIDogYXJjXSB8fCAocG9seWdvbnNCeUFyY1thcmNdID0gW10pKS5wdXNoKHBvbHlnb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcG9seWdvbnMucHVzaChwb2x5Z29uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHRlcmlvcihyaW5nJCQpIHtcbiAgICAgIHJldHVybiByaW5nKG9iamVjdCh0b3BvbG9neSwge3R5cGU6IFwiUG9seWdvblwiLCBhcmNzOiBbcmluZyQkXX0pLmNvb3JkaW5hdGVzWzBdKSA+IDA7IC8vIFRPRE8gYWxsb3cgc3BoZXJpY2FsP1xuICAgIH1cblxuICAgIHBvbHlnb25zLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgICAgaWYgKCFwb2x5Z29uLl8pIHtcbiAgICAgICAgdmFyIGNvbXBvbmVudCA9IFtdLFxuICAgICAgICAgICAgbmVpZ2hib3JzID0gW3BvbHlnb25dO1xuICAgICAgICBwb2x5Z29uLl8gPSAxO1xuICAgICAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgd2hpbGUgKHBvbHlnb24gPSBuZWlnaGJvcnMucG9wKCkpIHtcbiAgICAgICAgICBjb21wb25lbnQucHVzaChwb2x5Z29uKTtcbiAgICAgICAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZyQkKSB7XG4gICAgICAgICAgICByaW5nJCQuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgICAgICAgcG9seWdvbnNCeUFyY1thcmMgPCAwID8gfmFyYyA6IGFyY10uZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwb2x5Z29uLl8pIHtcbiAgICAgICAgICAgICAgICAgIHBvbHlnb24uXyA9IDE7XG4gICAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChwb2x5Z29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHBvbHlnb25zLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgICAgZGVsZXRlIHBvbHlnb24uXztcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIk11bHRpUG9seWdvblwiLFxuICAgICAgYXJjczogY29tcG9uZW50cy5tYXAoZnVuY3Rpb24ocG9seWdvbnMpIHtcbiAgICAgICAgdmFyIGFyY3MgPSBbXSwgbjtcblxuICAgICAgICAvLyBFeHRyYWN0IHRoZSBleHRlcmlvciAodW5pcXVlKSBhcmNzLlxuICAgICAgICBwb2x5Z29ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICAgICAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZyQkKSB7XG4gICAgICAgICAgICByaW5nJCQuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgICAgICAgaWYgKHBvbHlnb25zQnlBcmNbYXJjIDwgMCA/IH5hcmMgOiBhcmNdLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICBhcmNzLnB1c2goYXJjKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFN0aXRjaCB0aGUgYXJjcyBpbnRvIG9uZSBvciBtb3JlIHJpbmdzLlxuICAgICAgICBhcmNzID0gc3RpdGNoQXJjcyh0b3BvbG9neSwgYXJjcyk7XG5cbiAgICAgICAgLy8gSWYgbW9yZSB0aGFuIG9uZSByaW5nIGlzIHJldHVybmVkLFxuICAgICAgICAvLyBhdCBtb3N0IG9uZSBvZiB0aGVzZSByaW5ncyBjYW4gYmUgdGhlIGV4dGVyaW9yO1xuICAgICAgICAvLyB0aGlzIGV4dGVyaW9yIHJpbmcgaGFzIHRoZSBzYW1lIHdpbmRpbmcgb3JkZXJcbiAgICAgICAgLy8gYXMgYW55IGV4dGVyaW9yIHJpbmcgaW4gdGhlIG9yaWdpbmFsIHBvbHlnb25zLlxuICAgICAgICBpZiAoKG4gPSBhcmNzLmxlbmd0aCkgPiAxKSB7XG4gICAgICAgICAgdmFyIHNnbiA9IGV4dGVyaW9yKHBvbHlnb25zWzBdWzBdKTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgdDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKHNnbiA9PT0gZXh0ZXJpb3IoYXJjc1tpXSkpIHtcbiAgICAgICAgICAgICAgdCA9IGFyY3NbMF0sIGFyY3NbMF0gPSBhcmNzW2ldLCBhcmNzW2ldID0gdDtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFyY3M7XG4gICAgICB9KVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBuZWlnaGJvcnMob2JqZWN0cykge1xuICAgIHZhciBpbmRleGVzQnlBcmMgPSB7fSwgLy8gYXJjIGluZGV4IC0+IGFycmF5IG9mIG9iamVjdCBpbmRleGVzXG4gICAgICAgIG5laWdoYm9ycyA9IG9iamVjdHMubWFwKGZ1bmN0aW9uKCkgeyByZXR1cm4gW107IH0pO1xuXG4gICAgZnVuY3Rpb24gbGluZShhcmNzLCBpKSB7XG4gICAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oYSkge1xuICAgICAgICBpZiAoYSA8IDApIGEgPSB+YTtcbiAgICAgICAgdmFyIG8gPSBpbmRleGVzQnlBcmNbYV07XG4gICAgICAgIGlmIChvKSBvLnB1c2goaSk7XG4gICAgICAgIGVsc2UgaW5kZXhlc0J5QXJjW2FdID0gW2ldO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9seWdvbihhcmNzLCBpKSB7XG4gICAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7IGxpbmUoYXJjLCBpKTsgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VvbWV0cnkobywgaSkge1xuICAgICAgaWYgKG8udHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIikgby5nZW9tZXRyaWVzLmZvckVhY2goZnVuY3Rpb24obykgeyBnZW9tZXRyeShvLCBpKTsgfSk7XG4gICAgICBlbHNlIGlmIChvLnR5cGUgaW4gZ2VvbWV0cnlUeXBlKSBnZW9tZXRyeVR5cGVbby50eXBlXShvLmFyY3MsIGkpO1xuICAgIH1cblxuICAgIHZhciBnZW9tZXRyeVR5cGUgPSB7XG4gICAgICBMaW5lU3RyaW5nOiBsaW5lLFxuICAgICAgTXVsdGlMaW5lU3RyaW5nOiBwb2x5Z29uLFxuICAgICAgUG9seWdvbjogcG9seWdvbixcbiAgICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24oYXJjcywgaSkgeyBhcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7IHBvbHlnb24oYXJjLCBpKTsgfSk7IH1cbiAgICB9O1xuXG4gICAgb2JqZWN0cy5mb3JFYWNoKGdlb21ldHJ5KTtcblxuICAgIGZvciAodmFyIGkgaW4gaW5kZXhlc0J5QXJjKSB7XG4gICAgICBmb3IgKHZhciBpbmRleGVzID0gaW5kZXhlc0J5QXJjW2ldLCBtID0gaW5kZXhlcy5sZW5ndGgsIGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgICAgIGZvciAodmFyIGsgPSBqICsgMTsgayA8IG07ICsraykge1xuICAgICAgICAgIHZhciBpaiA9IGluZGV4ZXNbal0sIGlrID0gaW5kZXhlc1trXSwgbjtcbiAgICAgICAgICBpZiAoKG4gPSBuZWlnaGJvcnNbaWpdKVtpID0gYmlzZWN0KG4sIGlrKV0gIT09IGlrKSBuLnNwbGljZShpLCAwLCBpayk7XG4gICAgICAgICAgaWYgKChuID0gbmVpZ2hib3JzW2lrXSlbaSA9IGJpc2VjdChuLCBpaildICE9PSBpaikgbi5zcGxpY2UoaSwgMCwgaWopO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5laWdoYm9ycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBhcmVBcmVhKGEsIGIpIHtcbiAgICByZXR1cm4gYVsxXVsyXSAtIGJbMV1bMl07XG4gIH1cblxuICBmdW5jdGlvbiBtaW5BcmVhSGVhcCgpIHtcbiAgICB2YXIgaGVhcCA9IHt9LFxuICAgICAgICBhcnJheSA9IFtdLFxuICAgICAgICBzaXplID0gMDtcblxuICAgIGhlYXAucHVzaCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgdXAoYXJyYXlbb2JqZWN0Ll8gPSBzaXplXSA9IG9iamVjdCwgc2l6ZSsrKTtcbiAgICAgIHJldHVybiBzaXplO1xuICAgIH07XG5cbiAgICBoZWFwLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHNpemUgPD0gMCkgcmV0dXJuO1xuICAgICAgdmFyIHJlbW92ZWQgPSBhcnJheVswXSwgb2JqZWN0O1xuICAgICAgaWYgKC0tc2l6ZSA+IDApIG9iamVjdCA9IGFycmF5W3NpemVdLCBkb3duKGFycmF5W29iamVjdC5fID0gMF0gPSBvYmplY3QsIDApO1xuICAgICAgcmV0dXJuIHJlbW92ZWQ7XG4gICAgfTtcblxuICAgIGhlYXAucmVtb3ZlID0gZnVuY3Rpb24ocmVtb3ZlZCkge1xuICAgICAgdmFyIGkgPSByZW1vdmVkLl8sIG9iamVjdDtcbiAgICAgIGlmIChhcnJheVtpXSAhPT0gcmVtb3ZlZCkgcmV0dXJuOyAvLyBpbnZhbGlkIHJlcXVlc3RcbiAgICAgIGlmIChpICE9PSAtLXNpemUpIG9iamVjdCA9IGFycmF5W3NpemVdLCAoY29tcGFyZUFyZWEob2JqZWN0LCByZW1vdmVkKSA8IDAgPyB1cCA6IGRvd24pKGFycmF5W29iamVjdC5fID0gaV0gPSBvYmplY3QsIGkpO1xuICAgICAgcmV0dXJuIGk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwKG9iamVjdCwgaSkge1xuICAgICAgd2hpbGUgKGkgPiAwKSB7XG4gICAgICAgIHZhciBqID0gKChpICsgMSkgPj4gMSkgLSAxLFxuICAgICAgICAgICAgcGFyZW50ID0gYXJyYXlbal07XG4gICAgICAgIGlmIChjb21wYXJlQXJlYShvYmplY3QsIHBhcmVudCkgPj0gMCkgYnJlYWs7XG4gICAgICAgIGFycmF5W3BhcmVudC5fID0gaV0gPSBwYXJlbnQ7XG4gICAgICAgIGFycmF5W29iamVjdC5fID0gaSA9IGpdID0gb2JqZWN0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvd24ob2JqZWN0LCBpKSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB2YXIgciA9IChpICsgMSkgPDwgMSxcbiAgICAgICAgICAgIGwgPSByIC0gMSxcbiAgICAgICAgICAgIGogPSBpLFxuICAgICAgICAgICAgY2hpbGQgPSBhcnJheVtqXTtcbiAgICAgICAgaWYgKGwgPCBzaXplICYmIGNvbXBhcmVBcmVhKGFycmF5W2xdLCBjaGlsZCkgPCAwKSBjaGlsZCA9IGFycmF5W2ogPSBsXTtcbiAgICAgICAgaWYgKHIgPCBzaXplICYmIGNvbXBhcmVBcmVhKGFycmF5W3JdLCBjaGlsZCkgPCAwKSBjaGlsZCA9IGFycmF5W2ogPSByXTtcbiAgICAgICAgaWYgKGogPT09IGkpIGJyZWFrO1xuICAgICAgICBhcnJheVtjaGlsZC5fID0gaV0gPSBjaGlsZDtcbiAgICAgICAgYXJyYXlbb2JqZWN0Ll8gPSBpID0gal0gPSBvYmplY3Q7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGhlYXA7XG4gIH1cblxuICBmdW5jdGlvbiBwcmVzaW1wbGlmeSh0b3BvbG9neSwgdHJpYW5nbGVBcmVhKSB7XG4gICAgdmFyIGFic29sdXRlJCQgPSBhYnNvbHV0ZSh0b3BvbG9neS50cmFuc2Zvcm0pLFxuICAgICAgICByZWxhdGl2ZSQkID0gcmVsYXRpdmUodG9wb2xvZ3kudHJhbnNmb3JtKSxcbiAgICAgICAgaGVhcCA9IG1pbkFyZWFIZWFwKCk7XG5cbiAgICBpZiAoIXRyaWFuZ2xlQXJlYSkgdHJpYW5nbGVBcmVhID0gdHJpYW5nbGU7XG5cbiAgICB0b3BvbG9neS5hcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgICB2YXIgdHJpYW5nbGVzID0gW10sXG4gICAgICAgICAgbWF4QXJlYSA9IDAsXG4gICAgICAgICAgdHJpYW5nbGUsXG4gICAgICAgICAgaSxcbiAgICAgICAgICBuLFxuICAgICAgICAgIHA7XG5cbiAgICAgIC8vIFRvIHN0b3JlIGVhY2ggcG9pbnTigJlzIGVmZmVjdGl2ZSBhcmVhLCB3ZSBjcmVhdGUgYSBuZXcgYXJyYXkgcmF0aGVyIHRoYW5cbiAgICAgIC8vIGV4dGVuZGluZyB0aGUgcGFzc2VkLWluIHBvaW50IHRvIHdvcmthcm91bmQgYSBDaHJvbWUvVjggYnVnIChnZXR0aW5nXG4gICAgICAvLyBzdHVjayBpbiBzbWkgbW9kZSkuIEZvciBtaWRwb2ludHMsIHRoZSBpbml0aWFsIGVmZmVjdGl2ZSBhcmVhIG9mXG4gICAgICAvLyBJbmZpbml0eSB3aWxsIGJlIGNvbXB1dGVkIGluIHRoZSBuZXh0IHN0ZXAuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gYXJjLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBwID0gYXJjW2ldO1xuICAgICAgICBhYnNvbHV0ZSQkKGFyY1tpXSA9IFtwWzBdLCBwWzFdLCBJbmZpbml0eV0sIGkpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSAxLCBuID0gYXJjLmxlbmd0aCAtIDE7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgdHJpYW5nbGUgPSBhcmMuc2xpY2UoaSAtIDEsIGkgKyAyKTtcbiAgICAgICAgdHJpYW5nbGVbMV1bMl0gPSB0cmlhbmdsZUFyZWEodHJpYW5nbGUpO1xuICAgICAgICB0cmlhbmdsZXMucHVzaCh0cmlhbmdsZSk7XG4gICAgICAgIGhlYXAucHVzaCh0cmlhbmdsZSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSB0cmlhbmdsZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHRyaWFuZ2xlID0gdHJpYW5nbGVzW2ldO1xuICAgICAgICB0cmlhbmdsZS5wcmV2aW91cyA9IHRyaWFuZ2xlc1tpIC0gMV07XG4gICAgICAgIHRyaWFuZ2xlLm5leHQgPSB0cmlhbmdsZXNbaSArIDFdO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodHJpYW5nbGUgPSBoZWFwLnBvcCgpKSB7XG4gICAgICAgIHZhciBwcmV2aW91cyA9IHRyaWFuZ2xlLnByZXZpb3VzLFxuICAgICAgICAgICAgbmV4dCA9IHRyaWFuZ2xlLm5leHQ7XG5cbiAgICAgICAgLy8gSWYgdGhlIGFyZWEgb2YgdGhlIGN1cnJlbnQgcG9pbnQgaXMgbGVzcyB0aGFuIHRoYXQgb2YgdGhlIHByZXZpb3VzIHBvaW50XG4gICAgICAgIC8vIHRvIGJlIGVsaW1pbmF0ZWQsIHVzZSB0aGUgbGF0dGVyJ3MgYXJlYSBpbnN0ZWFkLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGVcbiAgICAgICAgLy8gY3VycmVudCBwb2ludCBjYW5ub3QgYmUgZWxpbWluYXRlZCB3aXRob3V0IGVsaW1pbmF0aW5nIHByZXZpb3VzbHktXG4gICAgICAgIC8vIGVsaW1pbmF0ZWQgcG9pbnRzLlxuICAgICAgICBpZiAodHJpYW5nbGVbMV1bMl0gPCBtYXhBcmVhKSB0cmlhbmdsZVsxXVsyXSA9IG1heEFyZWE7XG4gICAgICAgIGVsc2UgbWF4QXJlYSA9IHRyaWFuZ2xlWzFdWzJdO1xuXG4gICAgICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICAgIHByZXZpb3VzLm5leHQgPSBuZXh0O1xuICAgICAgICAgIHByZXZpb3VzWzJdID0gdHJpYW5nbGVbMl07XG4gICAgICAgICAgdXBkYXRlKHByZXZpb3VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgbmV4dC5wcmV2aW91cyA9IHByZXZpb3VzO1xuICAgICAgICAgIG5leHRbMF0gPSB0cmlhbmdsZVswXTtcbiAgICAgICAgICB1cGRhdGUobmV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXJjLmZvckVhY2gocmVsYXRpdmUkJCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGUodHJpYW5nbGUpIHtcbiAgICAgIGhlYXAucmVtb3ZlKHRyaWFuZ2xlKTtcbiAgICAgIHRyaWFuZ2xlWzFdWzJdID0gdHJpYW5nbGVBcmVhKHRyaWFuZ2xlKTtcbiAgICAgIGhlYXAucHVzaCh0cmlhbmdsZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRvcG9sb2d5O1xuICB9XG5cbiAgdmFyIHZlcnNpb24gPSBcIjEuNi4yNFwiO1xuXG4gIGV4cG9ydHMudmVyc2lvbiA9IHZlcnNpb247XG4gIGV4cG9ydHMubWVzaCA9IG1lc2g7XG4gIGV4cG9ydHMubWVzaEFyY3MgPSBtZXNoQXJjcztcbiAgZXhwb3J0cy5tZXJnZSA9IG1lcmdlO1xuICBleHBvcnRzLm1lcmdlQXJjcyA9IG1lcmdlQXJjcztcbiAgZXhwb3J0cy5mZWF0dXJlID0gZmVhdHVyZTtcbiAgZXhwb3J0cy5uZWlnaGJvcnMgPSBuZWlnaGJvcnM7XG4gIGV4cG9ydHMucHJlc2ltcGxpZnkgPSBwcmVzaW1wbGlmeTtcblxufSkpOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXG4gICAgdGltZSA9IHJlcXVpcmUoJy4vdGltZScpLFxuICAgIHV0YyA9IHRpbWUudXRjO1xuXG52YXIgdSA9IG1vZHVsZS5leHBvcnRzO1xuXG51LiR5ZWFyICAgPSB1dGlsLiRmdW5jKCd5ZWFyJywgdGltZS55ZWFyLnVuaXQpO1xudS4kbW9udGggID0gdXRpbC4kZnVuYygnbW9udGgnLCB0aW1lLm1vbnRocy51bml0KTtcbnUuJGRhdGUgICA9IHV0aWwuJGZ1bmMoJ2RhdGUnLCB0aW1lLmRhdGVzLnVuaXQpO1xudS4kZGF5ICAgID0gdXRpbC4kZnVuYygnZGF5JywgdGltZS53ZWVrZGF5cy51bml0KTtcbnUuJGhvdXIgICA9IHV0aWwuJGZ1bmMoJ2hvdXInLCB0aW1lLmhvdXJzLnVuaXQpO1xudS4kbWludXRlID0gdXRpbC4kZnVuYygnbWludXRlJywgdGltZS5taW51dGVzLnVuaXQpO1xudS4kc2Vjb25kID0gdXRpbC4kZnVuYygnc2Vjb25kJywgdGltZS5zZWNvbmRzLnVuaXQpO1xuXG51LiR1dGNZZWFyICAgPSB1dGlsLiRmdW5jKCd1dGNZZWFyJywgdXRjLnllYXIudW5pdCk7XG51LiR1dGNNb250aCAgPSB1dGlsLiRmdW5jKCd1dGNNb250aCcsIHV0Yy5tb250aHMudW5pdCk7XG51LiR1dGNEYXRlICAgPSB1dGlsLiRmdW5jKCd1dGNEYXRlJywgdXRjLmRhdGVzLnVuaXQpO1xudS4kdXRjRGF5ICAgID0gdXRpbC4kZnVuYygndXRjRGF5JywgdXRjLndlZWtkYXlzLnVuaXQpO1xudS4kdXRjSG91ciAgID0gdXRpbC4kZnVuYygndXRjSG91cicsIHV0Yy5ob3Vycy51bml0KTtcbnUuJHV0Y01pbnV0ZSA9IHV0aWwuJGZ1bmMoJ3V0Y01pbnV0ZScsIHV0Yy5taW51dGVzLnVuaXQpO1xudS4kdXRjU2Vjb25kID0gdXRpbC4kZnVuYygndXRjU2Vjb25kJywgdXRjLnNlY29uZHMudW5pdCk7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKSxcbiAgICBNZWFzdXJlcyA9IHJlcXVpcmUoJy4vbWVhc3VyZXMnKSxcbiAgICBDb2xsZWN0b3IgPSByZXF1aXJlKCcuL2NvbGxlY3RvcicpO1xuXG5mdW5jdGlvbiBBZ2dyZWdhdG9yKCkge1xuICB0aGlzLl9jZWxscyA9IHt9O1xuICB0aGlzLl9hZ2dyID0gW107XG4gIHRoaXMuX3N0cmVhbSA9IGZhbHNlO1xufVxuXG52YXIgRmxhZ3MgPSBBZ2dyZWdhdG9yLkZsYWdzID0ge1xuICBBRERfQ0VMTDogMSxcbiAgTU9EX0NFTEw6IDJcbn07XG5cbnZhciBwcm90byA9IEFnZ3JlZ2F0b3IucHJvdG90eXBlO1xuXG4vLyBQYXJhbWV0ZXJzXG5cbnByb3RvLnN0cmVhbSA9IGZ1bmN0aW9uKHYpIHtcbiAgaWYgKHYgPT0gbnVsbCkgcmV0dXJuIHRoaXMuX3N0cmVhbTtcbiAgdGhpcy5fc3RyZWFtID0gISF2O1xuICB0aGlzLl9hZ2dyID0gW107XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8ga2V5IGFjY2Vzc29yIHRvIHVzZSBmb3Igc3RyZWFtaW5nIHJlbW92ZXNcbnByb3RvLmtleSA9IGZ1bmN0aW9uKGtleSkge1xuICBpZiAoa2V5ID09IG51bGwpIHJldHVybiB0aGlzLl9rZXk7XG4gIHRoaXMuX2tleSA9IHV0aWwuJChrZXkpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIElucHV0OiBhcnJheSBvZiBvYmplY3RzIG9mIHRoZSBmb3JtXG4vLyB7bmFtZTogc3RyaW5nLCBnZXQ6IGZ1bmN0aW9ufVxucHJvdG8uZ3JvdXBieSA9IGZ1bmN0aW9uKGRpbXMpIHtcbiAgdGhpcy5fZGltcyA9IHV0aWwuYXJyYXkoZGltcykubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICBkID0gdXRpbC5pc1N0cmluZyhkKSA/IHtuYW1lOiBkLCBnZXQ6IHV0aWwuJChkKX1cbiAgICAgIDogdXRpbC5pc0Z1bmN0aW9uKGQpID8ge25hbWU6IHV0aWwubmFtZShkKSB8fCBkLm5hbWUgfHwgKCdfJyArIGkpLCBnZXQ6IGR9XG4gICAgICA6IChkLm5hbWUgJiYgdXRpbC5pc0Z1bmN0aW9uKGQuZ2V0KSkgPyBkIDogbnVsbDtcbiAgICBpZiAoZCA9PSBudWxsKSB0aHJvdyAnSW52YWxpZCBncm91cGJ5IGFyZ3VtZW50OiAnICsgZDtcbiAgICByZXR1cm4gZDtcbiAgfSk7XG4gIHJldHVybiB0aGlzLmNsZWFyKCk7XG59O1xuXG4vLyBJbnB1dDogYXJyYXkgb2Ygb2JqZWN0cyBvZiB0aGUgZm9ybVxuLy8ge25hbWU6IHN0cmluZywgb3BzOiBbc3RyaW5nLCAuLi5dfVxucHJvdG8uc3VtbWFyaXplID0gZnVuY3Rpb24oZmllbGRzKSB7XG4gIGZpZWxkcyA9IHN1bW1hcml6ZV9hcmdzKGZpZWxkcyk7XG4gIHRoaXMuX2NvdW50ID0gdHJ1ZTtcbiAgdmFyIGFnZ3IgPSAodGhpcy5fYWdnciA9IFtdKSxcbiAgICAgIG0sIGYsIGksIGosIG9wLCBhcywgZ2V0O1xuXG4gIGZvciAoaT0wOyBpPGZpZWxkcy5sZW5ndGg7ICsraSkge1xuICAgIGZvciAoaj0wLCBtPVtdLCBmPWZpZWxkc1tpXTsgajxmLm9wcy5sZW5ndGg7ICsraikge1xuICAgICAgb3AgPSBmLm9wc1tqXTtcbiAgICAgIGlmIChvcCAhPT0gJ2NvdW50JykgdGhpcy5fY291bnQgPSBmYWxzZTtcbiAgICAgIGFzID0gKGYuYXMgJiYgZi5hc1tqXSkgfHwgKG9wICsgKGYubmFtZT09PScqJyA/ICcnIDogJ18nK2YubmFtZSkpO1xuICAgICAgbS5wdXNoKE1lYXN1cmVzW29wXShhcykpO1xuICAgIH1cbiAgICBnZXQgPSBmLmdldCAmJiB1dGlsLiQoZi5nZXQpIHx8XG4gICAgICAoZi5uYW1lID09PSAnKicgPyB1dGlsLmlkZW50aXR5IDogdXRpbC4kKGYubmFtZSkpO1xuICAgIGFnZ3IucHVzaCh7XG4gICAgICBuYW1lOiBmLm5hbWUsXG4gICAgICBtZWFzdXJlczogTWVhc3VyZXMuY3JlYXRlKFxuICAgICAgICBtLFxuICAgICAgICB0aGlzLl9zdHJlYW0sIC8vIHN0cmVhbWluZyByZW1vdmUgZmxhZ1xuICAgICAgICBnZXQsICAgICAgICAgIC8vIGlucHV0IHR1cGxlIGdldHRlclxuICAgICAgICB0aGlzLl9hc3NpZ24pIC8vIG91dHB1dCB0dXBsZSBzZXR0ZXJcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gdGhpcy5jbGVhcigpO1xufTtcblxuLy8gQ29udmVuaWVuY2UgbWV0aG9kIHRvIHN1bW1hcml6ZSBieSBjb3VudFxucHJvdG8uY291bnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc3VtbWFyaXplKHsnKic6J2NvdW50J30pO1xufTtcblxuLy8gT3ZlcnJpZGUgdG8gcGVyZm9ybSBjdXN0b20gdHVwbGUgdmFsdWUgYXNzaWdubWVudFxucHJvdG8uX2Fzc2lnbiA9IGZ1bmN0aW9uKG9iamVjdCwgbmFtZSwgdmFsdWUpIHtcbiAgb2JqZWN0W25hbWVdID0gdmFsdWU7XG59O1xuXG5mdW5jdGlvbiBzdW1tYXJpemVfYXJncyhmaWVsZHMpIHtcbiAgaWYgKHV0aWwuaXNBcnJheShmaWVsZHMpKSB7IHJldHVybiBmaWVsZHM7IH1cbiAgaWYgKGZpZWxkcyA9PSBudWxsKSB7IHJldHVybiBbXTsgfVxuICB2YXIgYSA9IFtdLCBuYW1lLCBvcHM7XG4gIGZvciAobmFtZSBpbiBmaWVsZHMpIHtcbiAgICBvcHMgPSB1dGlsLmFycmF5KGZpZWxkc1tuYW1lXSk7XG4gICAgYS5wdXNoKHtuYW1lOiBuYW1lLCBvcHM6IG9wc30pO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG4vLyBDZWxsIE1hbmFnZW1lbnRcblxucHJvdG8uY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0aGlzLl9jZWxscyA9IHt9LCB0aGlzKTtcbn07XG5cbnByb3RvLl9jZWxsa2V5ID0gZnVuY3Rpb24oeCkge1xuICB2YXIgZCA9IHRoaXMuX2RpbXMsXG4gICAgICBuID0gZC5sZW5ndGgsIGksXG4gICAgICBrID0gU3RyaW5nKGRbMF0uZ2V0KHgpKTtcbiAgZm9yIChpPTE7IGk8bjsgKytpKSB7XG4gICAgayArPSAnfCcgKyBkW2ldLmdldCh4KTtcbiAgfVxuICByZXR1cm4gaztcbn07XG5cbnByb3RvLl9jZWxsID0gZnVuY3Rpb24oeCkge1xuICB2YXIga2V5ID0gdGhpcy5fZGltcy5sZW5ndGggPyB0aGlzLl9jZWxsa2V5KHgpIDogJyc7XG4gIHJldHVybiB0aGlzLl9jZWxsc1trZXldIHx8ICh0aGlzLl9jZWxsc1trZXldID0gdGhpcy5fbmV3Y2VsbCh4LCBrZXkpKTtcbn07XG5cbnByb3RvLl9uZXdjZWxsID0gZnVuY3Rpb24oeCwga2V5KSB7XG4gIHZhciBjZWxsID0ge1xuICAgIG51bTogICAwLFxuICAgIHR1cGxlOiB0aGlzLl9uZXd0dXBsZSh4LCBrZXkpLFxuICAgIGZsYWc6ICBGbGFncy5BRERfQ0VMTCxcbiAgICBhZ2dzOiAge31cbiAgfTtcblxuICB2YXIgYWdnciA9IHRoaXMuX2FnZ3IsIGk7XG4gIGZvciAoaT0wOyBpPGFnZ3IubGVuZ3RoOyArK2kpIHtcbiAgICBjZWxsLmFnZ3NbYWdncltpXS5uYW1lXSA9IG5ldyBhZ2dyW2ldLm1lYXN1cmVzKGNlbGwsIGNlbGwudHVwbGUpO1xuICB9XG4gIGlmIChjZWxsLmNvbGxlY3QpIHtcbiAgICBjZWxsLmRhdGEgPSBuZXcgQ29sbGVjdG9yKHRoaXMuX2tleSk7XG4gIH1cbiAgcmV0dXJuIGNlbGw7XG59O1xuXG5wcm90by5fbmV3dHVwbGUgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBkaW1zID0gdGhpcy5fZGltcyxcbiAgICAgIHQgPSB7fSwgaSwgbjtcbiAgZm9yIChpPTAsIG49ZGltcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdFtkaW1zW2ldLm5hbWVdID0gZGltc1tpXS5nZXQoeCk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2luZ2VzdCh0KTtcbn07XG5cbi8vIE92ZXJyaWRlIHRvIHBlcmZvcm0gY3VzdG9tIHR1cGxlIGluZ2VzdGlvblxucHJvdG8uX2luZ2VzdCA9IHV0aWwuaWRlbnRpdHk7XG5cbi8vIFByb2Nlc3MgVHVwbGVzXG5cbnByb3RvLl9hZGQgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBjZWxsID0gdGhpcy5fY2VsbCh4KSxcbiAgICAgIGFnZ3IgPSB0aGlzLl9hZ2dyLCBpO1xuXG4gIGNlbGwubnVtICs9IDE7XG4gIGlmICghdGhpcy5fY291bnQpIHsgLy8gc2tpcCBpZiBjb3VudC1vbmx5XG4gICAgaWYgKGNlbGwuY29sbGVjdCkgY2VsbC5kYXRhLmFkZCh4KTtcbiAgICBmb3IgKGk9MDsgaTxhZ2dyLmxlbmd0aDsgKytpKSB7XG4gICAgICBjZWxsLmFnZ3NbYWdncltpXS5uYW1lXS5hZGQoeCk7XG4gICAgfVxuICB9XG4gIGNlbGwuZmxhZyB8PSBGbGFncy5NT0RfQ0VMTDtcbiAgaWYgKHRoaXMuX29uX2FkZCkgdGhpcy5fb25fYWRkKHgsIGNlbGwpO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGNlbGwgPSB0aGlzLl9jZWxsKHgpLFxuICAgICAgYWdnciA9IHRoaXMuX2FnZ3IsIGk7XG5cbiAgY2VsbC5udW0gLT0gMTtcbiAgaWYgKCF0aGlzLl9jb3VudCkgeyAvLyBza2lwIGlmIGNvdW50LW9ubHlcbiAgICBpZiAoY2VsbC5jb2xsZWN0KSBjZWxsLmRhdGEucmVtKHgpO1xuICAgIGZvciAoaT0wOyBpPGFnZ3IubGVuZ3RoOyArK2kpIHtcbiAgICAgIGNlbGwuYWdnc1thZ2dyW2ldLm5hbWVdLnJlbSh4KTtcbiAgICB9XG4gIH1cbiAgY2VsbC5mbGFnIHw9IEZsYWdzLk1PRF9DRUxMO1xuICBpZiAodGhpcy5fb25fcmVtKSB0aGlzLl9vbl9yZW0oeCwgY2VsbCk7XG59O1xuXG5wcm90by5fbW9kID0gZnVuY3Rpb24oY3VyciwgcHJldikge1xuICB2YXIgY2VsbDAgPSB0aGlzLl9jZWxsKHByZXYpLFxuICAgICAgY2VsbDEgPSB0aGlzLl9jZWxsKGN1cnIpLFxuICAgICAgYWdnciA9IHRoaXMuX2FnZ3IsIGk7XG5cbiAgaWYgKGNlbGwwICE9PSBjZWxsMSkge1xuICAgIGNlbGwwLm51bSAtPSAxO1xuICAgIGNlbGwxLm51bSArPSAxO1xuICAgIGlmIChjZWxsMC5jb2xsZWN0KSBjZWxsMC5kYXRhLnJlbShwcmV2KTtcbiAgICBpZiAoY2VsbDEuY29sbGVjdCkgY2VsbDEuZGF0YS5hZGQoY3Vycik7XG4gIH0gZWxzZSBpZiAoY2VsbDAuY29sbGVjdCAmJiAhdXRpbC5pc09iamVjdChjdXJyKSkge1xuICAgIGNlbGwwLmRhdGEucmVtKHByZXYpO1xuICAgIGNlbGwwLmRhdGEuYWRkKGN1cnIpO1xuICB9XG5cbiAgZm9yIChpPTA7IGk8YWdnci5sZW5ndGg7ICsraSkge1xuICAgIGNlbGwwLmFnZ3NbYWdncltpXS5uYW1lXS5yZW0ocHJldik7XG4gICAgY2VsbDEuYWdnc1thZ2dyW2ldLm5hbWVdLmFkZChjdXJyKTtcbiAgfVxuICBjZWxsMC5mbGFnIHw9IEZsYWdzLk1PRF9DRUxMO1xuICBjZWxsMS5mbGFnIHw9IEZsYWdzLk1PRF9DRUxMO1xuICBpZiAodGhpcy5fb25fbW9kKSB0aGlzLl9vbl9tb2QoY3VyciwgcHJldiwgY2VsbDAsIGNlbGwxKTtcbn07XG5cbnByb3RvLl9tYXJrTW9kID0gZnVuY3Rpb24oeCkge1xuICB2YXIgY2VsbDAgPSB0aGlzLl9jZWxsKHgpO1xuICBjZWxsMC5mbGFnIHw9IEZsYWdzLk1PRF9DRUxMO1xufTtcblxucHJvdG8ucmVzdWx0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXN1bHQgPSBbXSxcbiAgICAgIGFnZ3IgPSB0aGlzLl9hZ2dyLFxuICAgICAgY2VsbCwgaSwgaztcblxuICBmb3IgKGsgaW4gdGhpcy5fY2VsbHMpIHtcbiAgICBjZWxsID0gdGhpcy5fY2VsbHNba107XG4gICAgaWYgKGNlbGwubnVtID4gMCkge1xuICAgICAgLy8gY29uc29saWRhdGUgY29sbGVjdG9yIHZhbHVlc1xuICAgICAgaWYgKGNlbGwuY29sbGVjdCkge1xuICAgICAgICBjZWxsLmRhdGEudmFsdWVzKCk7XG4gICAgICB9XG4gICAgICAvLyB1cGRhdGUgdHVwbGUgcHJvcGVydGllc1xuICAgICAgZm9yIChpPTA7IGk8YWdnci5sZW5ndGg7ICsraSkge1xuICAgICAgICBjZWxsLmFnZ3NbYWdncltpXS5uYW1lXS5zZXQoKTtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCBvdXRwdXQgdHVwbGVcbiAgICAgIHJlc3VsdC5wdXNoKGNlbGwudHVwbGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdGhpcy5fY2VsbHNba107XG4gICAgfVxuICAgIGNlbGwuZmxhZyA9IDA7XG4gIH1cblxuICB0aGlzLl9yZW1zID0gZmFsc2U7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5wcm90by5jaGFuZ2VzID0gZnVuY3Rpb24ob3V0cHV0KSB7XG4gIHZhciBjaGFuZ2VzID0gb3V0cHV0IHx8IHthZGQ6W10sIHJlbTpbXSwgbW9kOltdfSxcbiAgICAgIGFnZ3IgPSB0aGlzLl9hZ2dyLFxuICAgICAgY2VsbCwgZmxhZywgaSwgaztcblxuICBmb3IgKGsgaW4gdGhpcy5fY2VsbHMpIHtcbiAgICBjZWxsID0gdGhpcy5fY2VsbHNba107XG4gICAgZmxhZyA9IGNlbGwuZmxhZztcblxuICAgIC8vIGNvbnNvbGlkYXRlIGNvbGxlY3RvciB2YWx1ZXNcbiAgICBpZiAoY2VsbC5jb2xsZWN0KSB7XG4gICAgICBjZWxsLmRhdGEudmFsdWVzKCk7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIHR1cGxlIHByb3BlcnRpZXNcbiAgICBmb3IgKGk9MDsgaTxhZ2dyLmxlbmd0aDsgKytpKSB7XG4gICAgICBjZWxsLmFnZ3NbYWdncltpXS5uYW1lXS5zZXQoKTtcbiAgICB9XG5cbiAgICAvLyBvcmdhbml6ZSBvdXRwdXQgdHVwbGVzXG4gICAgaWYgKGNlbGwubnVtIDw9IDApIHtcbiAgICAgIGNoYW5nZXMucmVtLnB1c2goY2VsbC50dXBsZSk7IC8vIGlmIChmbGFnID09PSBGbGFncy5NT0RfQ0VMTCkgeyA/P1xuICAgICAgZGVsZXRlIHRoaXMuX2NlbGxzW2tdO1xuICAgICAgaWYgKHRoaXMuX29uX2Ryb3ApIHRoaXMuX29uX2Ryb3AoY2VsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl9vbl9rZWVwKSB0aGlzLl9vbl9rZWVwKGNlbGwpO1xuICAgICAgaWYgKGZsYWcgJiBGbGFncy5BRERfQ0VMTCkge1xuICAgICAgICBjaGFuZ2VzLmFkZC5wdXNoKGNlbGwudHVwbGUpO1xuICAgICAgfSBlbHNlIGlmIChmbGFnICYgRmxhZ3MuTU9EX0NFTEwpIHtcbiAgICAgICAgY2hhbmdlcy5tb2QucHVzaChjZWxsLnR1cGxlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjZWxsLmZsYWcgPSAwO1xuICB9XG5cbiAgdGhpcy5fcmVtcyA9IGZhbHNlO1xuICByZXR1cm4gY2hhbmdlcztcbn07XG5cbnByb3RvLmV4ZWN1dGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gdGhpcy5jbGVhcigpLmluc2VydChpbnB1dCkucmVzdWx0KCk7XG59O1xuXG5wcm90by5pbnNlcnQgPSBmdW5jdGlvbihpbnB1dCkge1xuICB0aGlzLl9jb25zb2xpZGF0ZSgpO1xuICBmb3IgKHZhciBpPTA7IGk8aW5wdXQubGVuZ3RoOyArK2kpIHtcbiAgICB0aGlzLl9hZGQoaW5wdXRbaV0pO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYgKCF0aGlzLl9zdHJlYW0pIHtcbiAgICB0aHJvdyAnQWdncmVnYXRvciBub3QgY29uZmlndXJlZCBmb3Igc3RyZWFtaW5nIHJlbW92ZXMuJyArXG4gICAgICAnIENhbGwgc3RyZWFtKHRydWUpIHByaW9yIHRvIGNhbGxpbmcgc3VtbWFyaXplLic7XG4gIH1cbiAgZm9yICh2YXIgaT0wOyBpPGlucHV0Lmxlbmd0aDsgKytpKSB7XG4gICAgdGhpcy5fcmVtKGlucHV0W2ldKTtcbiAgfVxuICB0aGlzLl9yZW1zID0gdHJ1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBjb25zb2xpZGF0ZSByZW1vdmFsc1xucHJvdG8uX2NvbnNvbGlkYXRlID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5fcmVtcykgcmV0dXJuO1xuICBmb3IgKHZhciBrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgaWYgKHRoaXMuX2NlbGxzW2tdLmNvbGxlY3QpIHtcbiAgICAgIHRoaXMuX2NlbGxzW2tdLmRhdGEudmFsdWVzKCk7XG4gICAgfVxuICB9XG4gIHRoaXMuX3JlbXMgPSBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQWdncmVnYXRvcjtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIHN0YXRzID0gcmVxdWlyZSgnLi4vc3RhdHMnKTtcblxudmFyIFJFTSA9ICdfX2RsX3JlbV9fJztcblxuZnVuY3Rpb24gQ29sbGVjdG9yKGtleSkge1xuICB0aGlzLl9hZGQgPSBbXTtcbiAgdGhpcy5fcmVtID0gW107XG4gIHRoaXMuX2tleSA9IGtleSB8fCBudWxsO1xuICB0aGlzLl9sYXN0ID0gbnVsbDtcbn1cblxudmFyIHByb3RvID0gQ29sbGVjdG9yLnByb3RvdHlwZTtcblxucHJvdG8uYWRkID0gZnVuY3Rpb24odikge1xuICB0aGlzLl9hZGQucHVzaCh2KTtcbn07XG5cbnByb3RvLnJlbSA9IGZ1bmN0aW9uKHYpIHtcbiAgdGhpcy5fcmVtLnB1c2godik7XG59O1xuXG5wcm90by52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fZ2V0ID0gbnVsbDtcbiAgaWYgKHRoaXMuX3JlbS5sZW5ndGggPT09IDApIHJldHVybiB0aGlzLl9hZGQ7XG5cbiAgdmFyIGEgPSB0aGlzLl9hZGQsXG4gICAgICByID0gdGhpcy5fcmVtLFxuICAgICAgayA9IHRoaXMuX2tleSxcbiAgICAgIHggPSBBcnJheShhLmxlbmd0aCAtIHIubGVuZ3RoKSxcbiAgICAgIGksIGosIG4sIG07XG5cbiAgaWYgKCF1dGlsLmlzT2JqZWN0KHJbMF0pKSB7XG4gICAgLy8gcHJvY2Vzc2luZyByYXcgdmFsdWVzXG4gICAgbSA9IHN0YXRzLmNvdW50Lm1hcChyKTtcbiAgICBmb3IgKGk9MCwgaj0wLCBuPWEubGVuZ3RoOyBpPG47ICsraSkge1xuICAgICAgaWYgKG1bYVtpXV0gPiAwKSB7XG4gICAgICAgIG1bYVtpXV0gLT0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHhbaisrXSA9IGFbaV07XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGspIHtcbiAgICAvLyBoYXMgdW5pcXVlIGtleSBmaWVsZCwgc28gdXNlIHRoYXRcbiAgICBtID0gdXRpbC50b01hcChyLCBrKTtcbiAgICBmb3IgKGk9MCwgaj0wLCBuPWEubGVuZ3RoOyBpPG47ICsraSkge1xuICAgICAgaWYgKCFtLmhhc093blByb3BlcnR5KGsoYVtpXSkpKSB7IHhbaisrXSA9IGFbaV07IH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gbm8gdW5pcXVlIGtleSwgbWFyayB0dXBsZXMgZGlyZWN0bHlcbiAgICBmb3IgKGk9MCwgbj1yLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICAgIHJbaV1bUkVNXSA9IDE7XG4gICAgfVxuICAgIGZvciAoaT0wLCBqPTAsIG49YS5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgICBpZiAoIWFbaV1bUkVNXSkgeyB4W2orK10gPSBhW2ldOyB9XG4gICAgfVxuICAgIGZvciAoaT0wLCBuPXIubGVuZ3RoOyBpPG47ICsraSkge1xuICAgICAgZGVsZXRlIHJbaV1bUkVNXTtcbiAgICB9XG4gIH1cblxuICB0aGlzLl9yZW0gPSBbXTtcbiAgcmV0dXJuICh0aGlzLl9hZGQgPSB4KTtcbn07XG5cbi8vIG1lbW9pemluZyBzdGF0aXN0aWNzIG1ldGhvZHNcblxucHJvdG8uZXh0ZW50ID0gZnVuY3Rpb24oZ2V0KSB7XG4gIGlmICh0aGlzLl9nZXQgIT09IGdldCB8fCAhdGhpcy5fZXh0KSB7XG4gICAgdmFyIHYgPSB0aGlzLnZhbHVlcygpLFxuICAgICAgICBpID0gc3RhdHMuZXh0ZW50LmluZGV4KHYsIGdldCk7XG4gICAgdGhpcy5fZXh0ID0gW3ZbaVswXV0sIHZbaVsxXV1dO1xuICAgIHRoaXMuX2dldCA9IGdldDtcbiAgfVxuICByZXR1cm4gdGhpcy5fZXh0O1xufTtcblxucHJvdG8uYXJnbWluID0gZnVuY3Rpb24oZ2V0KSB7XG4gIHJldHVybiB0aGlzLmV4dGVudChnZXQpWzBdO1xufTtcblxucHJvdG8uYXJnbWF4ID0gZnVuY3Rpb24oZ2V0KSB7XG4gIHJldHVybiB0aGlzLmV4dGVudChnZXQpWzFdO1xufTtcblxucHJvdG8ubWluID0gZnVuY3Rpb24oZ2V0KSB7XG4gIHZhciBtID0gdGhpcy5leHRlbnQoZ2V0KVswXTtcbiAgcmV0dXJuIG0gIT0gbnVsbCA/IGdldChtKSA6ICtJbmZpbml0eTtcbn07XG5cbnByb3RvLm1heCA9IGZ1bmN0aW9uKGdldCkge1xuICB2YXIgbSA9IHRoaXMuZXh0ZW50KGdldClbMV07XG4gIHJldHVybiBtICE9IG51bGwgPyBnZXQobSkgOiAtSW5maW5pdHk7XG59O1xuXG5wcm90by5xdWFydGlsZSA9IGZ1bmN0aW9uKGdldCkge1xuICBpZiAodGhpcy5fZ2V0ICE9PSBnZXQgfHwgIXRoaXMuX3EpIHtcbiAgICB0aGlzLl9xID0gc3RhdHMucXVhcnRpbGUodGhpcy52YWx1ZXMoKSwgZ2V0KTtcbiAgICB0aGlzLl9nZXQgPSBnZXQ7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX3E7XG59O1xuXG5wcm90by5xMSA9IGZ1bmN0aW9uKGdldCkge1xuICByZXR1cm4gdGhpcy5xdWFydGlsZShnZXQpWzBdO1xufTtcblxucHJvdG8ucTIgPSBmdW5jdGlvbihnZXQpIHtcbiAgcmV0dXJuIHRoaXMucXVhcnRpbGUoZ2V0KVsxXTtcbn07XG5cbnByb3RvLnEzID0gZnVuY3Rpb24oZ2V0KSB7XG4gIHJldHVybiB0aGlzLnF1YXJ0aWxlKGdldClbMl07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3RvcjtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIEFnZ3JlZ2F0b3IgPSByZXF1aXJlKCcuL2FnZ3JlZ2F0b3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgLy8gZmxhdHRlbiBhcmd1bWVudHMgaW50byBhIHNpbmdsZSBhcnJheVxuICB2YXIgYXJncyA9IFtdLnJlZHVjZS5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24oYSwgeCkge1xuICAgIHJldHVybiBhLmNvbmNhdCh1dGlsLmFycmF5KHgpKTtcbiAgfSwgW10pO1xuICAvLyBjcmVhdGUgYW5kIHJldHVybiBhbiBhZ2dyZWdhdG9yXG4gIHJldHVybiBuZXcgQWdncmVnYXRvcigpXG4gICAgLmdyb3VwYnkoYXJncylcbiAgICAuc3VtbWFyaXplKHsnKic6J3ZhbHVlcyd9KTtcbn07XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxudmFyIHR5cGVzID0ge1xuICAndmFsdWVzJzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ3ZhbHVlcycsXG4gICAgaW5pdDogJ2NlbGwuY29sbGVjdCA9IHRydWU7JyxcbiAgICBzZXQ6ICAnY2VsbC5kYXRhLnZhbHVlcygpJywgaWR4OiAtMVxuICB9KSxcbiAgJ2NvdW50JzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ2NvdW50JyxcbiAgICBzZXQ6ICAnY2VsbC5udW0nXG4gIH0pLFxuICAnbWlzc2luZyc6IG1lYXN1cmUoe1xuICAgIG5hbWU6ICdtaXNzaW5nJyxcbiAgICBzZXQ6ICAndGhpcy5taXNzaW5nJ1xuICB9KSxcbiAgJ3ZhbGlkJzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ3ZhbGlkJyxcbiAgICBzZXQ6ICAndGhpcy52YWxpZCdcbiAgfSksXG4gICdzdW0nOiBtZWFzdXJlKHtcbiAgICBuYW1lOiAnc3VtJyxcbiAgICBpbml0OiAndGhpcy5zdW0gPSAwOycsXG4gICAgYWRkOiAgJ3RoaXMuc3VtICs9IHY7JyxcbiAgICByZW06ICAndGhpcy5zdW0gLT0gdjsnLFxuICAgIHNldDogICd0aGlzLnN1bSdcbiAgfSksXG4gICdtZWFuJzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ21lYW4nLFxuICAgIGluaXQ6ICd0aGlzLm1lYW4gPSAwOycsXG4gICAgYWRkOiAgJ3ZhciBkID0gdiAtIHRoaXMubWVhbjsgdGhpcy5tZWFuICs9IGQgLyB0aGlzLnZhbGlkOycsXG4gICAgcmVtOiAgJ3ZhciBkID0gdiAtIHRoaXMubWVhbjsgdGhpcy5tZWFuIC09IHRoaXMudmFsaWQgPyBkIC8gdGhpcy52YWxpZCA6IHRoaXMubWVhbjsnLFxuICAgIHNldDogICd0aGlzLm1lYW4nXG4gIH0pLFxuICAnYXZlcmFnZSc6IG1lYXN1cmUoe1xuICAgIG5hbWU6ICdhdmVyYWdlJyxcbiAgICBzZXQ6ICAndGhpcy5tZWFuJyxcbiAgICByZXE6ICBbJ21lYW4nXSwgaWR4OiAxXG4gIH0pLFxuICAndmFyaWFuY2UnOiBtZWFzdXJlKHtcbiAgICBuYW1lOiAndmFyaWFuY2UnLFxuICAgIGluaXQ6ICd0aGlzLmRldiA9IDA7JyxcbiAgICBhZGQ6ICAndGhpcy5kZXYgKz0gZCAqICh2IC0gdGhpcy5tZWFuKTsnLFxuICAgIHJlbTogICd0aGlzLmRldiAtPSBkICogKHYgLSB0aGlzLm1lYW4pOycsXG4gICAgc2V0OiAgJ3RoaXMudmFsaWQgPiAxID8gdGhpcy5kZXYgLyAodGhpcy52YWxpZC0xKSA6IDAnLFxuICAgIHJlcTogIFsnbWVhbiddLCBpZHg6IDFcbiAgfSksXG4gICd2YXJpYW5jZXAnOiBtZWFzdXJlKHtcbiAgICBuYW1lOiAndmFyaWFuY2VwJyxcbiAgICBzZXQ6ICAndGhpcy52YWxpZCA+IDEgPyB0aGlzLmRldiAvIHRoaXMudmFsaWQgOiAwJyxcbiAgICByZXE6ICBbJ3ZhcmlhbmNlJ10sIGlkeDogMlxuICB9KSxcbiAgJ3N0ZGV2JzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ3N0ZGV2JyxcbiAgICBzZXQ6ICAndGhpcy52YWxpZCA+IDEgPyBNYXRoLnNxcnQodGhpcy5kZXYgLyAodGhpcy52YWxpZC0xKSkgOiAwJyxcbiAgICByZXE6ICBbJ3ZhcmlhbmNlJ10sIGlkeDogMlxuICB9KSxcbiAgJ3N0ZGV2cCc6IG1lYXN1cmUoe1xuICAgIG5hbWU6ICdzdGRldnAnLFxuICAgIHNldDogICd0aGlzLnZhbGlkID4gMSA/IE1hdGguc3FydCh0aGlzLmRldiAvIHRoaXMudmFsaWQpIDogMCcsXG4gICAgcmVxOiAgWyd2YXJpYW5jZSddLCBpZHg6IDJcbiAgfSksXG4gICdtZWRpYW4nOiBtZWFzdXJlKHtcbiAgICBuYW1lOiAnbWVkaWFuJyxcbiAgICBzZXQ6ICAnY2VsbC5kYXRhLnEyKHRoaXMuZ2V0KScsXG4gICAgcmVxOiAgWyd2YWx1ZXMnXSwgaWR4OiAzXG4gIH0pLFxuICAncTEnOiBtZWFzdXJlKHtcbiAgICBuYW1lOiAncTEnLFxuICAgIHNldDogICdjZWxsLmRhdGEucTEodGhpcy5nZXQpJyxcbiAgICByZXE6ICBbJ3ZhbHVlcyddLCBpZHg6IDNcbiAgfSksXG4gICdxMyc6IG1lYXN1cmUoe1xuICAgIG5hbWU6ICdxMycsXG4gICAgc2V0OiAgJ2NlbGwuZGF0YS5xMyh0aGlzLmdldCknLFxuICAgIHJlcTogIFsndmFsdWVzJ10sIGlkeDogM1xuICB9KSxcbiAgJ2Rpc3RpbmN0JzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ2Rpc3RpbmN0JyxcbiAgICBzZXQ6ICAndGhpcy5kaXN0aW5jdChjZWxsLmRhdGEudmFsdWVzKCksIHRoaXMuZ2V0KScsXG4gICAgcmVxOiAgWyd2YWx1ZXMnXSwgaWR4OiAzXG4gIH0pLFxuICAnYXJnbWluJzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ2FyZ21pbicsXG4gICAgYWRkOiAgJ2lmICh2IDwgdGhpcy5taW4pIHRoaXMuYXJnbWluID0gdDsnLFxuICAgIHJlbTogICdpZiAodiA8PSB0aGlzLm1pbikgdGhpcy5hcmdtaW4gPSBudWxsOycsXG4gICAgc2V0OiAgJ3RoaXMuYXJnbWluID0gdGhpcy5hcmdtaW4gfHwgY2VsbC5kYXRhLmFyZ21pbih0aGlzLmdldCknLFxuICAgIHJlcTogIFsnbWluJ10sIHN0cjogWyd2YWx1ZXMnXSwgaWR4OiAzXG4gIH0pLFxuICAnYXJnbWF4JzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ2FyZ21heCcsXG4gICAgYWRkOiAgJ2lmICh2ID4gdGhpcy5tYXgpIHRoaXMuYXJnbWF4ID0gdDsnLFxuICAgIHJlbTogICdpZiAodiA+PSB0aGlzLm1heCkgdGhpcy5hcmdtYXggPSBudWxsOycsXG4gICAgc2V0OiAgJ3RoaXMuYXJnbWF4ID0gdGhpcy5hcmdtYXggfHwgY2VsbC5kYXRhLmFyZ21heCh0aGlzLmdldCknLFxuICAgIHJlcTogIFsnbWF4J10sIHN0cjogWyd2YWx1ZXMnXSwgaWR4OiAzXG4gIH0pLFxuICAnbWluJzogbWVhc3VyZSh7XG4gICAgbmFtZTogJ21pbicsXG4gICAgaW5pdDogJ3RoaXMubWluID0gK0luZmluaXR5OycsXG4gICAgYWRkOiAgJ2lmICh2IDwgdGhpcy5taW4pIHRoaXMubWluID0gdjsnLFxuICAgIHJlbTogICdpZiAodiA8PSB0aGlzLm1pbikgdGhpcy5taW4gPSBOYU47JyxcbiAgICBzZXQ6ICAndGhpcy5taW4gPSAoaXNOYU4odGhpcy5taW4pID8gY2VsbC5kYXRhLm1pbih0aGlzLmdldCkgOiB0aGlzLm1pbiknLFxuICAgIHN0cjogIFsndmFsdWVzJ10sIGlkeDogNFxuICB9KSxcbiAgJ21heCc6IG1lYXN1cmUoe1xuICAgIG5hbWU6ICdtYXgnLFxuICAgIGluaXQ6ICd0aGlzLm1heCA9IC1JbmZpbml0eTsnLFxuICAgIGFkZDogICdpZiAodiA+IHRoaXMubWF4KSB0aGlzLm1heCA9IHY7JyxcbiAgICByZW06ICAnaWYgKHYgPj0gdGhpcy5tYXgpIHRoaXMubWF4ID0gTmFOOycsXG4gICAgc2V0OiAgJ3RoaXMubWF4ID0gKGlzTmFOKHRoaXMubWF4KSA/IGNlbGwuZGF0YS5tYXgodGhpcy5nZXQpIDogdGhpcy5tYXgpJyxcbiAgICBzdHI6ICBbJ3ZhbHVlcyddLCBpZHg6IDRcbiAgfSksXG4gICdtb2Rlc2tldyc6IG1lYXN1cmUoe1xuICAgIG5hbWU6ICdtb2Rlc2tldycsXG4gICAgc2V0OiAgJ3RoaXMuZGV2PT09MCA/IDAgOiAodGhpcy5tZWFuIC0gY2VsbC5kYXRhLnEyKHRoaXMuZ2V0KSkgLyBNYXRoLnNxcnQodGhpcy5kZXYvKHRoaXMudmFsaWQtMSkpJyxcbiAgICByZXE6ICBbJ21lYW4nLCAnc3RkZXYnLCAnbWVkaWFuJ10sIGlkeDogNVxuICB9KVxufTtcblxuZnVuY3Rpb24gbWVhc3VyZShiYXNlKSB7XG4gIHJldHVybiBmdW5jdGlvbihvdXQpIHtcbiAgICB2YXIgbSA9IHV0aWwuZXh0ZW5kKHtpbml0OicnLCBhZGQ6JycsIHJlbTonJywgaWR4OjB9LCBiYXNlKTtcbiAgICBtLm91dCA9IG91dCB8fCBiYXNlLm5hbWU7XG4gICAgcmV0dXJuIG07XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmUoYWdnLCBzdHJlYW0pIHtcbiAgZnVuY3Rpb24gY29sbGVjdChtLCBhKSB7XG4gICAgZnVuY3Rpb24gaGVscGVyKHIpIHsgaWYgKCFtW3JdKSBjb2xsZWN0KG0sIG1bcl0gPSB0eXBlc1tyXSgpKTsgfVxuICAgIGlmIChhLnJlcSkgYS5yZXEuZm9yRWFjaChoZWxwZXIpO1xuICAgIGlmIChzdHJlYW0gJiYgYS5zdHIpIGEuc3RyLmZvckVhY2goaGVscGVyKTtcbiAgICByZXR1cm4gbTtcbiAgfVxuICB2YXIgbWFwID0gYWdnLnJlZHVjZShcbiAgICBjb2xsZWN0LFxuICAgIGFnZy5yZWR1Y2UoZnVuY3Rpb24obSwgYSkgeyByZXR1cm4gKG1bYS5uYW1lXSA9IGEsIG0pOyB9LCB7fSlcbiAgKTtcbiAgcmV0dXJuIHV0aWwudmFscyhtYXApLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS5pZHggLSBiLmlkeDsgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZShhZ2csIHN0cmVhbSwgYWNjZXNzb3IsIG11dGF0b3IpIHtcbiAgdmFyIGFsbCA9IHJlc29sdmUoYWdnLCBzdHJlYW0pLFxuICAgICAgY3RyID0gJ3RoaXMuY2VsbCA9IGNlbGw7IHRoaXMudHVwbGUgPSB0OyB0aGlzLnZhbGlkID0gMDsgdGhpcy5taXNzaW5nID0gMDsnLFxuICAgICAgYWRkID0gJ2lmICh2PT1udWxsKSB0aGlzLm1pc3NpbmcrKzsgaWYgKCF0aGlzLmlzVmFsaWQodikpIHJldHVybjsgKyt0aGlzLnZhbGlkOycsXG4gICAgICByZW0gPSAnaWYgKHY9PW51bGwpIHRoaXMubWlzc2luZy0tOyBpZiAoIXRoaXMuaXNWYWxpZCh2KSkgcmV0dXJuOyAtLXRoaXMudmFsaWQ7JyxcbiAgICAgIHNldCA9ICd2YXIgdCA9IHRoaXMudHVwbGU7IHZhciBjZWxsID0gdGhpcy5jZWxsOyc7XG5cbiAgYWxsLmZvckVhY2goZnVuY3Rpb24oYSkge1xuICAgIGlmIChhLmlkeCA8IDApIHtcbiAgICAgIGN0ciA9IGEuaW5pdCArIGN0cjtcbiAgICAgIGFkZCA9IGEuYWRkICsgYWRkO1xuICAgICAgcmVtID0gYS5yZW0gKyByZW07XG4gICAgfSBlbHNlIHtcbiAgICAgIGN0ciArPSBhLmluaXQ7XG4gICAgICBhZGQgKz0gYS5hZGQ7XG4gICAgICByZW0gKz0gYS5yZW07XG4gICAgfVxuICB9KTtcbiAgYWdnLnNsaWNlKClcbiAgICAuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLmlkeCAtIGIuaWR4OyB9KVxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKGEpIHtcbiAgICAgIHNldCArPSAndGhpcy5hc3NpZ24odCxcXCcnK2Eub3V0KydcXCcsJythLnNldCsnKTsnO1xuICAgIH0pO1xuICBzZXQgKz0gJ3JldHVybiB0Oyc7XG5cbiAgLyoganNoaW50IGV2aWw6IHRydWUgKi9cbiAgY3RyID0gRnVuY3Rpb24oJ2NlbGwnLCAndCcsIGN0cik7XG4gIGN0ci5wcm90b3R5cGUuYXNzaWduID0gbXV0YXRvcjtcbiAgY3RyLnByb3RvdHlwZS5hZGQgPSBGdW5jdGlvbigndCcsICd2YXIgdiA9IHRoaXMuZ2V0KHQpOycgKyBhZGQpO1xuICBjdHIucHJvdG90eXBlLnJlbSA9IEZ1bmN0aW9uKCd0JywgJ3ZhciB2ID0gdGhpcy5nZXQodCk7JyArIHJlbSk7XG4gIGN0ci5wcm90b3R5cGUuc2V0ID0gRnVuY3Rpb24oc2V0KTtcbiAgY3RyLnByb3RvdHlwZS5nZXQgPSBhY2Nlc3NvcjtcbiAgY3RyLnByb3RvdHlwZS5kaXN0aW5jdCA9IHJlcXVpcmUoJy4uL3N0YXRzJykuY291bnQuZGlzdGluY3Q7XG4gIGN0ci5wcm90b3R5cGUuaXNWYWxpZCA9IHV0aWwuaXNWYWxpZDtcbiAgY3RyLmZpZWxkcyA9IGFnZy5tYXAodXRpbC4kKCdvdXQnKSk7XG4gIHJldHVybiBjdHI7XG59XG5cbnR5cGVzLmNyZWF0ZSA9IGNyZWF0ZTtcbm1vZHVsZS5leHBvcnRzID0gdHlwZXM7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKSxcbiAgICB0aW1lID0gcmVxdWlyZSgnLi4vdGltZScpLFxuICAgIEVQU0lMT04gPSAxZS0xNTtcblxuZnVuY3Rpb24gYmlucyhvcHQpIHtcbiAgaWYgKCFvcHQpIHsgdGhyb3cgRXJyb3IoXCJNaXNzaW5nIGJpbm5pbmcgb3B0aW9ucy5cIik7IH1cblxuICAvLyBkZXRlcm1pbmUgcmFuZ2VcbiAgdmFyIG1heGIgPSBvcHQubWF4YmlucyB8fCAxNSxcbiAgICAgIGJhc2UgPSBvcHQuYmFzZSB8fCAxMCxcbiAgICAgIGxvZ2IgPSBNYXRoLmxvZyhiYXNlKSxcbiAgICAgIGRpdiA9IG9wdC5kaXYgfHwgWzUsIDJdLFxuICAgICAgbWluID0gb3B0Lm1pbixcbiAgICAgIG1heCA9IG9wdC5tYXgsXG4gICAgICBzcGFuID0gbWF4IC0gbWluLFxuICAgICAgc3RlcCwgbGV2ZWwsIG1pbnN0ZXAsIHByZWNpc2lvbiwgdiwgaSwgZXBzO1xuXG4gIGlmIChvcHQuc3RlcCkge1xuICAgIC8vIGlmIHN0ZXAgc2l6ZSBpcyBleHBsaWNpdGx5IGdpdmVuLCB1c2UgdGhhdFxuICAgIHN0ZXAgPSBvcHQuc3RlcDtcbiAgfSBlbHNlIGlmIChvcHQuc3RlcHMpIHtcbiAgICAvLyBpZiBwcm92aWRlZCwgbGltaXQgY2hvaWNlIHRvIGFjY2VwdGFibGUgc3RlcCBzaXplc1xuICAgIHN0ZXAgPSBvcHQuc3RlcHNbTWF0aC5taW4oXG4gICAgICBvcHQuc3RlcHMubGVuZ3RoIC0gMSxcbiAgICAgIGJpc2VjdChvcHQuc3RlcHMsIHNwYW4vbWF4YiwgMCwgb3B0LnN0ZXBzLmxlbmd0aClcbiAgICApXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBlbHNlIHVzZSBzcGFuIHRvIGRldGVybWluZSBzdGVwIHNpemVcbiAgICBsZXZlbCA9IE1hdGguY2VpbChNYXRoLmxvZyhtYXhiKSAvIGxvZ2IpO1xuICAgIG1pbnN0ZXAgPSBvcHQubWluc3RlcCB8fCAwO1xuICAgIHN0ZXAgPSBNYXRoLm1heChcbiAgICAgIG1pbnN0ZXAsXG4gICAgICBNYXRoLnBvdyhiYXNlLCBNYXRoLnJvdW5kKE1hdGgubG9nKHNwYW4pIC8gbG9nYikgLSBsZXZlbClcbiAgICApO1xuXG4gICAgLy8gaW5jcmVhc2Ugc3RlcCBzaXplIGlmIHRvbyBtYW55IGJpbnNcbiAgICB3aGlsZSAoTWF0aC5jZWlsKHNwYW4vc3RlcCkgPiBtYXhiKSB7IHN0ZXAgKj0gYmFzZTsgfVxuXG4gICAgLy8gZGVjcmVhc2Ugc3RlcCBzaXplIGlmIGFsbG93ZWRcbiAgICBmb3IgKGk9MDsgaTxkaXYubGVuZ3RoOyArK2kpIHtcbiAgICAgIHYgPSBzdGVwIC8gZGl2W2ldO1xuICAgICAgaWYgKHYgPj0gbWluc3RlcCAmJiBzcGFuIC8gdiA8PSBtYXhiKSBzdGVwID0gdjtcbiAgICB9XG4gIH1cblxuICAvLyB1cGRhdGUgcHJlY2lzaW9uLCBtaW4gYW5kIG1heFxuICB2ID0gTWF0aC5sb2coc3RlcCk7XG4gIHByZWNpc2lvbiA9IHYgPj0gMCA/IDAgOiB+figtdiAvIGxvZ2IpICsgMTtcbiAgZXBzID0gTWF0aC5wb3coYmFzZSwgLXByZWNpc2lvbiAtIDEpO1xuICBtaW4gPSBNYXRoLm1pbihtaW4sIE1hdGguZmxvb3IobWluIC8gc3RlcCArIGVwcykgKiBzdGVwKTtcbiAgbWF4ID0gTWF0aC5jZWlsKG1heCAvIHN0ZXApICogc3RlcDtcblxuICByZXR1cm4ge1xuICAgIHN0YXJ0OiBtaW4sXG4gICAgc3RvcDogIG1heCxcbiAgICBzdGVwOiAgc3RlcCxcbiAgICB1bml0OiAge3ByZWNpc2lvbjogcHJlY2lzaW9ufSxcbiAgICB2YWx1ZTogdmFsdWUsXG4gICAgaW5kZXg6IGluZGV4XG4gIH07XG59XG5cbmZ1bmN0aW9uIGJpc2VjdChhLCB4LCBsbywgaGkpIHtcbiAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICBpZiAodXRpbC5jbXAoYVttaWRdLCB4KSA8IDApIHsgbG8gPSBtaWQgKyAxOyB9XG4gICAgZWxzZSB7IGhpID0gbWlkOyB9XG4gIH1cbiAgcmV0dXJuIGxvO1xufVxuXG5mdW5jdGlvbiB2YWx1ZSh2KSB7XG4gIHJldHVybiB0aGlzLnN0ZXAgKiBNYXRoLmZsb29yKHYgLyB0aGlzLnN0ZXAgKyBFUFNJTE9OKTtcbn1cblxuZnVuY3Rpb24gaW5kZXgodikge1xuICByZXR1cm4gTWF0aC5mbG9vcigodiAtIHRoaXMuc3RhcnQpIC8gdGhpcy5zdGVwICsgRVBTSUxPTik7XG59XG5cbmZ1bmN0aW9uIGRhdGVfdmFsdWUodikge1xuICByZXR1cm4gdGhpcy51bml0LmRhdGUodmFsdWUuY2FsbCh0aGlzLCB2KSk7XG59XG5cbmZ1bmN0aW9uIGRhdGVfaW5kZXgodikge1xuICByZXR1cm4gaW5kZXguY2FsbCh0aGlzLCB0aGlzLnVuaXQudW5pdCh2KSk7XG59XG5cbmJpbnMuZGF0ZSA9IGZ1bmN0aW9uKG9wdCkge1xuICBpZiAoIW9wdCkgeyB0aHJvdyBFcnJvcihcIk1pc3NpbmcgZGF0ZSBiaW5uaW5nIG9wdGlvbnMuXCIpOyB9XG5cbiAgLy8gZmluZCB0aW1lIHN0ZXAsIHRoZW4gYmluXG4gIHZhciB1bml0cyA9IG9wdC51dGMgPyB0aW1lLnV0YyA6IHRpbWUsXG4gICAgICBkbWluID0gb3B0Lm1pbixcbiAgICAgIGRtYXggPSBvcHQubWF4LFxuICAgICAgbWF4YiA9IG9wdC5tYXhiaW5zIHx8IDIwLFxuICAgICAgbWluYiA9IG9wdC5taW5iaW5zIHx8IDQsXG4gICAgICBzcGFuID0gKCtkbWF4KSAtICgrZG1pbiksXG4gICAgICB1bml0ID0gb3B0LnVuaXQgPyB1bml0c1tvcHQudW5pdF0gOiB1bml0cy5maW5kKHNwYW4sIG1pbmIsIG1heGIpLFxuICAgICAgc3BlYyA9IGJpbnMoe1xuICAgICAgICBtaW46ICAgICB1bml0Lm1pbiAhPSBudWxsID8gdW5pdC5taW4gOiB1bml0LnVuaXQoZG1pbiksXG4gICAgICAgIG1heDogICAgIHVuaXQubWF4ICE9IG51bGwgPyB1bml0Lm1heCA6IHVuaXQudW5pdChkbWF4KSxcbiAgICAgICAgbWF4YmluczogbWF4YixcbiAgICAgICAgbWluc3RlcDogdW5pdC5taW5zdGVwLFxuICAgICAgICBzdGVwczogICB1bml0LnN0ZXBcbiAgICAgIH0pO1xuXG4gIHNwZWMudW5pdCA9IHVuaXQ7XG4gIHNwZWMuaW5kZXggPSBkYXRlX2luZGV4O1xuICBpZiAoIW9wdC5yYXcpIHNwZWMudmFsdWUgPSBkYXRlX3ZhbHVlO1xuICByZXR1cm4gc3BlYztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmlucztcbiIsInZhciBiaW5zID0gcmVxdWlyZSgnLi9iaW5zJyksXG4gICAgZ2VuICA9IHJlcXVpcmUoJy4uL2dlbmVyYXRlJyksXG4gICAgdHlwZSA9IHJlcXVpcmUoJy4uL2ltcG9ydC90eXBlJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKSxcbiAgICBzdGF0cyA9IHJlcXVpcmUoJy4uL3N0YXRzJyk7XG5cbnZhciBxdHlwZSA9IHtcbiAgJ2ludGVnZXInOiAxLFxuICAnbnVtYmVyJzogMSxcbiAgJ2RhdGUnOiAxXG59O1xuXG5mdW5jdGlvbiAkYmluKHZhbHVlcywgZiwgb3B0KSB7XG4gIG9wdCA9IG9wdGlvbnModmFsdWVzLCBmLCBvcHQpO1xuICB2YXIgYiA9IHNwZWMob3B0KTtcbiAgcmV0dXJuICFiID8gKG9wdC5hY2Nlc3NvciB8fCB1dGlsLmlkZW50aXR5KSA6XG4gICAgdXRpbC4kZnVuYygnYmluJywgYi51bml0LnVuaXQgP1xuICAgICAgZnVuY3Rpb24oeCkgeyByZXR1cm4gYi52YWx1ZShiLnVuaXQudW5pdCh4KSk7IH0gOlxuICAgICAgZnVuY3Rpb24oeCkgeyByZXR1cm4gYi52YWx1ZSh4KTsgfVxuICAgICkob3B0LmFjY2Vzc29yKTtcbn1cblxuZnVuY3Rpb24gaGlzdG9ncmFtKHZhbHVlcywgZiwgb3B0KSB7XG4gIG9wdCA9IG9wdGlvbnModmFsdWVzLCBmLCBvcHQpO1xuICB2YXIgYiA9IHNwZWMob3B0KTtcbiAgcmV0dXJuIGIgP1xuICAgIG51bWVyaWNhbCh2YWx1ZXMsIG9wdC5hY2Nlc3NvciwgYikgOlxuICAgIGNhdGVnb3JpY2FsKHZhbHVlcywgb3B0LmFjY2Vzc29yLCBvcHQgJiYgb3B0LnNvcnQpO1xufVxuXG5mdW5jdGlvbiBzcGVjKG9wdCkge1xuICB2YXIgdCA9IG9wdC50eXBlLCBiID0gbnVsbDtcbiAgaWYgKHQgPT0gbnVsbCB8fCBxdHlwZVt0XSkge1xuICAgIGlmICh0ID09PSAnaW50ZWdlcicgJiYgb3B0Lm1pbnN0ZXAgPT0gbnVsbCkgb3B0Lm1pbnN0ZXAgPSAxO1xuICAgIGIgPSAodCA9PT0gJ2RhdGUnKSA/IGJpbnMuZGF0ZShvcHQpIDogYmlucyhvcHQpO1xuICB9XG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiBvcHRpb25zKCkge1xuICB2YXIgYSA9IGFyZ3VtZW50cyxcbiAgICAgIGkgPSAwLFxuICAgICAgdmFsdWVzID0gdXRpbC5pc0FycmF5KGFbaV0pID8gYVtpKytdIDogbnVsbCxcbiAgICAgIGYgPSB1dGlsLmlzRnVuY3Rpb24oYVtpXSkgfHwgdXRpbC5pc1N0cmluZyhhW2ldKSA/IHV0aWwuJChhW2krK10pIDogbnVsbCxcbiAgICAgIG9wdCA9IHV0aWwuZXh0ZW5kKHt9LCBhW2ldKTtcblxuICBpZiAodmFsdWVzKSB7XG4gICAgb3B0LnR5cGUgPSBvcHQudHlwZSB8fCB0eXBlKHZhbHVlcywgZik7XG4gICAgaWYgKHF0eXBlW29wdC50eXBlXSkge1xuICAgICAgdmFyIGV4dCA9IHN0YXRzLmV4dGVudCh2YWx1ZXMsIGYpO1xuICAgICAgb3B0ID0gdXRpbC5leHRlbmQoe21pbjogZXh0WzBdLCBtYXg6IGV4dFsxXX0sIG9wdCk7XG4gICAgfVxuICB9XG4gIGlmIChmKSB7IG9wdC5hY2Nlc3NvciA9IGY7IH1cbiAgcmV0dXJuIG9wdDtcbn1cblxuZnVuY3Rpb24gbnVtZXJpY2FsKHZhbHVlcywgZiwgYikge1xuICB2YXIgaCA9IGdlbi5yYW5nZShiLnN0YXJ0LCBiLnN0b3AgKyBiLnN0ZXAvMiwgYi5zdGVwKVxuICAgIC5tYXAoZnVuY3Rpb24odikgeyByZXR1cm4ge3ZhbHVlOiBiLnZhbHVlKHYpLCBjb3VudDogMH07IH0pO1xuXG4gIGZvciAodmFyIGk9MCwgdiwgajsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodXRpbC5pc1ZhbGlkKHYpKSB7XG4gICAgICBqID0gYi5pbmRleCh2KTtcbiAgICAgIGlmIChqIDwgMCB8fCBqID49IGgubGVuZ3RoIHx8ICFpc0Zpbml0ZShqKSkgY29udGludWU7XG4gICAgICBoW2pdLmNvdW50ICs9IDE7XG4gICAgfVxuICB9XG4gIGguYmlucyA9IGI7XG4gIHJldHVybiBoO1xufVxuXG5mdW5jdGlvbiBjYXRlZ29yaWNhbCh2YWx1ZXMsIGYsIHNvcnQpIHtcbiAgdmFyIHUgPSBzdGF0cy51bmlxdWUodmFsdWVzLCBmKSxcbiAgICAgIGMgPSBzdGF0cy5jb3VudC5tYXAodmFsdWVzLCBmKTtcbiAgcmV0dXJuIHUubWFwKGZ1bmN0aW9uKGspIHsgcmV0dXJuIHt2YWx1ZTogaywgY291bnQ6IGNba119OyB9KVxuICAgIC5zb3J0KHV0aWwuY29tcGFyYXRvcihzb3J0ID8gJy1jb3VudCcgOiAnK3ZhbHVlJykpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJGJpbjogJGJpbixcbiAgaGlzdG9ncmFtOiBoaXN0b2dyYW1cbn07XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHR5cGUgPSByZXF1aXJlKCcuL2ltcG9ydC90eXBlJyksXG4gICAgc3RhdHMgPSByZXF1aXJlKCcuL3N0YXRzJyksXG4gICAgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB0YWJsZTogICBmb3JtYXRUYWJsZSwgIC8vIGZvcm1hdCBhIGRhdGEgdGFibGVcbiAgc3VtbWFyeTogZm9ybWF0U3VtbWFyeSAvLyBmb3JtYXQgYSBkYXRhIHRhYmxlIHN1bW1hcnlcbn07XG5cbnZhciBGTVQgPSB7XG4gICdkYXRlJzogICAgJ3x0aW1lOlwiJW0vJWQvJVkgJUg6JU06JVNcIicsXG4gICdudW1iZXInOiAgJ3xudW1iZXI6XCIuNGZcIicsXG4gICdpbnRlZ2VyJzogJ3xudW1iZXI6XCJkXCInXG59O1xuXG52YXIgUE9TID0ge1xuICAnbnVtYmVyJzogICdsZWZ0JyxcbiAgJ2ludGVnZXInOiAnbGVmdCdcbn07XG5cbmZ1bmN0aW9uIGZvcm1hdFRhYmxlKGRhdGEsIG9wdCkge1xuICBvcHQgPSB1dGlsLmV4dGVuZCh7c2VwYXJhdG9yOicgJywgbWlud2lkdGg6IDgsIG1heHdpZHRoOiAxNX0sIG9wdCk7XG4gIHZhciBmaWVsZHMgPSBvcHQuZmllbGRzIHx8IHV0aWwua2V5cyhkYXRhWzBdKSxcbiAgICAgIHR5cGVzID0gdHlwZS5hbGwoZGF0YSk7XG5cbiAgaWYgKG9wdC5zdGFydCB8fCBvcHQubGltaXQpIHtcbiAgICB2YXIgYSA9IG9wdC5zdGFydCB8fCAwLFxuICAgICAgICBiID0gb3B0LmxpbWl0ID8gYSArIG9wdC5saW1pdCA6IGRhdGEubGVuZ3RoO1xuICAgIGRhdGEgPSBkYXRhLnNsaWNlKGEsIGIpO1xuICB9XG5cbiAgLy8gZGV0ZXJtaW5lIGNoYXIgd2lkdGggb2YgZmllbGRzXG4gIHZhciBsZW5zID0gZmllbGRzLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIGZvcm1hdCA9IEZNVFt0eXBlc1tuYW1lXV0gfHwgJycsXG4gICAgICAgIHQgPSB0ZW1wbGF0ZSgne3snICsgbmFtZSArIGZvcm1hdCArICd9fScpLFxuICAgICAgICBsID0gc3RhdHMubWF4KGRhdGEsIGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHQoeCkubGVuZ3RoOyB9KTtcbiAgICBsID0gTWF0aC5tYXgoTWF0aC5taW4obmFtZS5sZW5ndGgsIG9wdC5taW53aWR0aCksIGwpO1xuICAgIHJldHVybiBvcHQubWF4d2lkdGggPiAwID8gTWF0aC5taW4obCwgb3B0Lm1heHdpZHRoKSA6IGw7XG4gIH0pO1xuXG4gIC8vIHByaW50IGhlYWRlciByb3dcbiAgdmFyIGhlYWQgPSBmaWVsZHMubWFwKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICByZXR1cm4gdXRpbC50cnVuY2F0ZSh1dGlsLnBhZChuYW1lLCBsZW5zW2ldLCAnY2VudGVyJyksIGxlbnNbaV0pO1xuICB9KS5qb2luKG9wdC5zZXBhcmF0b3IpO1xuXG4gIC8vIGJ1aWxkIHRlbXBsYXRlIGZ1bmN0aW9uIGZvciBlYWNoIHJvd1xuICB2YXIgdG1wbCA9IHRlbXBsYXRlKGZpZWxkcy5tYXAoZnVuY3Rpb24obmFtZSwgaSkge1xuICAgIHJldHVybiAne3snICtcbiAgICAgIG5hbWUgK1xuICAgICAgKEZNVFt0eXBlc1tuYW1lXV0gfHwgJycpICtcbiAgICAgICgnfHBhZDonICsgbGVuc1tpXSArICcsJyArIChQT1NbdHlwZXNbbmFtZV1dIHx8ICdyaWdodCcpKSArXG4gICAgICAoJ3x0cnVuY2F0ZTonICsgbGVuc1tpXSkgK1xuICAgICd9fSc7XG4gIH0pLmpvaW4ob3B0LnNlcGFyYXRvcikpO1xuXG4gIC8vIHByaW50IHRhYmxlXG4gIHJldHVybiBoZWFkICsgXCJcXG5cIiArIGRhdGEubWFwKHRtcGwpLmpvaW4oJ1xcbicpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRTdW1tYXJ5KHMpIHtcbiAgcyA9IHMgPyBzLl9fc3VtbWFyeV9fID8gcyA6IHN0YXRzLnN1bW1hcnkocykgOiB0aGlzO1xuICB2YXIgc3RyID0gW10sIGksIG47XG4gIGZvciAoaT0wLCBuPXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHN0ci5wdXNoKCctLSAnICsgc1tpXS5maWVsZCArICcgLS0nKTtcbiAgICBpZiAoc1tpXS50eXBlID09PSAnc3RyaW5nJyB8fCBzW2ldLmRpc3RpbmN0IDwgMTApIHtcbiAgICAgIHN0ci5wdXNoKHByaW50Q2F0ZWdvcmljYWxQcm9maWxlKHNbaV0pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyLnB1c2gocHJpbnRRdWFudGl0YXRpdmVQcm9maWxlKHNbaV0pKTtcbiAgICB9XG4gICAgc3RyLnB1c2goJycpO1xuICB9XG4gIHJldHVybiBzdHIuam9pbignXFxuJyk7XG59XG5cbmZ1bmN0aW9uIHByaW50UXVhbnRpdGF0aXZlUHJvZmlsZShwKSB7XG4gIHJldHVybiBbXG4gICAgJ3ZhbGlkOiAgICAnICsgcC52YWxpZCxcbiAgICAnbWlzc2luZzogICcgKyBwLm1pc3NpbmcsXG4gICAgJ2Rpc3RpbmN0OiAnICsgcC5kaXN0aW5jdCxcbiAgICAnbWluOiAgICAgICcgKyBwLm1pbixcbiAgICAnbWF4OiAgICAgICcgKyBwLm1heCxcbiAgICAnbWVkaWFuOiAgICcgKyBwLm1lZGlhbixcbiAgICAnbWVhbjogICAgICcgKyBwLm1lYW4sXG4gICAgJ3N0ZGV2OiAgICAnICsgcC5zdGRldixcbiAgICAnbW9kZXNrZXc6ICcgKyBwLm1vZGVza2V3XG4gIF0uam9pbignXFxuJyk7XG59XG5cbmZ1bmN0aW9uIHByaW50Q2F0ZWdvcmljYWxQcm9maWxlKHApIHtcbiAgdmFyIGxpc3QgPSBbXG4gICAgJ3ZhbGlkOiAgICAnICsgcC52YWxpZCxcbiAgICAnbWlzc2luZzogICcgKyBwLm1pc3NpbmcsXG4gICAgJ2Rpc3RpbmN0OiAnICsgcC5kaXN0aW5jdCxcbiAgICAndG9wIHZhbHVlczogJ1xuICBdO1xuICB2YXIgdSA9IHAudW5pcXVlO1xuICB2YXIgdG9wID0gdXRpbC5rZXlzKHUpXG4gICAgLnNvcnQoZnVuY3Rpb24oYSxiKSB7IHJldHVybiB1W2JdIC0gdVthXTsgfSlcbiAgICAuc2xpY2UoMCwgNilcbiAgICAubWFwKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICcgXFwnJyArIHYgKyAnXFwnICgnICsgdVt2XSArICcpJzsgfSk7XG4gIHJldHVybiBsaXN0LmNvbmNhdCh0b3ApLmpvaW4oJ1xcbicpO1xufSIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXG4gICAgZDNfdGltZSA9IHJlcXVpcmUoJ2QzLXRpbWUnKSxcbiAgICBkM190aW1lRiA9IHJlcXVpcmUoJ2QzLXRpbWUtZm9ybWF0JyksXG4gICAgZDNfbnVtYmVyRiA9IHJlcXVpcmUoJ2QzLWZvcm1hdCcpLFxuICAgIG51bWJlckYgPSBkM19udW1iZXJGLCAvLyBkZWZhdWx0cyB0byBFTi1VU1xuICAgIHRpbWVGID0gZDNfdGltZUYsICAgICAvLyBkZWZhdWx0cyB0byBFTi1VU1xuICAgIHRtcERhdGUgPSBuZXcgRGF0ZSgyMDAwLCAwLCAxKSxcbiAgICBtb250aEZ1bGwsIG1vbnRoQWJiciwgZGF5RnVsbCwgZGF5QWJicjtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gVXBkYXRlIG51bWJlciBmb3JtYXR0ZXIgdG8gdXNlIHByb3ZpZGVkIGxvY2FsZSBjb25maWd1cmF0aW9uLlxuICAvLyBGb3IgbW9yZSBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWZvcm1hdFxuICBudW1iZXJMb2NhbGU6IG51bWJlckxvY2FsZSxcbiAgbnVtYmVyOiAgICAgICBmdW5jdGlvbihmKSB7IHJldHVybiBudW1iZXJGLmZvcm1hdChmKTsgfSxcbiAgbnVtYmVyUHJlZml4OiBmdW5jdGlvbihmLCB2KSB7IHJldHVybiBudW1iZXJGLmZvcm1hdFByZWZpeChmLCB2KTsgfSxcblxuICAvLyBVcGRhdGUgdGltZSBmb3JtYXR0ZXIgdG8gdXNlIHByb3ZpZGVkIGxvY2FsZSBjb25maWd1cmF0aW9uLlxuICAvLyBGb3IgbW9yZSBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLXRpbWUtZm9ybWF0XG4gIHRpbWVMb2NhbGU6ICAgdGltZUxvY2FsZSxcbiAgdGltZTogICAgICAgICBmdW5jdGlvbihmKSB7IHJldHVybiB0aW1lRi5mb3JtYXQoZik7IH0sXG4gIHV0YzogICAgICAgICAgZnVuY3Rpb24oZikgeyByZXR1cm4gdGltZUYudXRjRm9ybWF0KGYpOyB9LFxuXG4gIC8vIFNldCBudW1iZXIgYW5kIHRpbWUgbG9jYWxlIHNpbXVsdGFuZW91c2x5LlxuICBsb2NhbGU6ICAgICAgIGZ1bmN0aW9uKGwpIHsgbnVtYmVyTG9jYWxlKGwpOyB0aW1lTG9jYWxlKGwpOyB9LFxuXG4gIC8vIGF1dG9tYXRpYyBmb3JtYXR0aW5nIGZ1bmN0aW9uc1xuICBhdXRvOiB7XG4gICAgbnVtYmVyOiAgIGF1dG9OdW1iZXJGb3JtYXQsXG4gICAgbGluZWFyOiAgIGxpbmVhck51bWJlckZvcm1hdCxcbiAgICB0aW1lOiAgICAgZnVuY3Rpb24oKSB7IHJldHVybiB0aW1lQXV0b0Zvcm1hdCgpOyB9LFxuICAgIHV0YzogICAgICBmdW5jdGlvbigpIHsgcmV0dXJuIHV0Y0F1dG9Gb3JtYXQoKTsgfVxuICB9LFxuXG4gIG1vbnRoOiBtb250aEZvcm1hdCwgLy8gZm9ybWF0IG1vbnRoIG5hbWUgZnJvbSBpbnRlZ2VyIGNvZGVcbiAgZGF5OiAgIGRheUZvcm1hdCAgICAvLyBmb3JtYXQgd2VlayBkYXkgbmFtZSBmcm9tIGludGVnZXIgY29kZVxufTtcblxuLy8gLS0gTG9jYWxlcyAtLS0tXG5cbi8vIHRyYW5zZm9ybSAnZW4tVVMnIHN0eWxlIGxvY2FsZSBzdHJpbmcgdG8gbWF0Y2ggZDMtZm9ybWF0IHYwLjQrIGNvbnZlbnRpb25cbmZ1bmN0aW9uIGxvY2FsZVJlZihsKSB7XG4gIHJldHVybiBsLmxlbmd0aCA+IDQgJiYgJ2xvY2FsZScgKyAoXG4gICAgbFswXS50b1VwcGVyQ2FzZSgpICsgbFsxXS50b0xvd2VyQ2FzZSgpICtcbiAgICBsWzNdLnRvVXBwZXJDYXNlKCkgKyBsWzRdLnRvTG93ZXJDYXNlKClcbiAgKTtcbn1cblxuZnVuY3Rpb24gbnVtYmVyTG9jYWxlKGwpIHtcbiAgdmFyIGYgPSB1dGlsLmlzU3RyaW5nKGwpID8gZDNfbnVtYmVyRltsb2NhbGVSZWYobCldIDogZDNfbnVtYmVyRi5sb2NhbGUobCk7XG4gIGlmIChmID09IG51bGwpIHRocm93IEVycm9yKCdVbnJlY29nbml6ZWQgbG9jYWxlOiAnICsgbCk7XG4gIG51bWJlckYgPSBmO1xufVxuXG5mdW5jdGlvbiB0aW1lTG9jYWxlKGwpIHtcbiAgdmFyIGYgPSB1dGlsLmlzU3RyaW5nKGwpID8gZDNfdGltZUZbbG9jYWxlUmVmKGwpXSA6IGQzX3RpbWVGLmxvY2FsZShsKTtcbiAgaWYgKGYgPT0gbnVsbCkgdGhyb3cgRXJyb3IoJ1VucmVjb2duaXplZCBsb2NhbGU6ICcgKyBsKTtcbiAgdGltZUYgPSBmO1xuICBtb250aEZ1bGwgPSBtb250aEFiYnIgPSBkYXlGdWxsID0gZGF5QWJiciA9IG51bGw7XG59XG5cbi8vIC0tIE51bWJlciBGb3JtYXR0aW5nIC0tLS1cblxudmFyIGUxMCA9IE1hdGguc3FydCg1MCksXG4gICAgZTUgPSBNYXRoLnNxcnQoMTApLFxuICAgIGUyID0gTWF0aC5zcXJ0KDIpO1xuXG5mdW5jdGlvbiBsaW5lYXJSYW5nZShkb21haW4sIGNvdW50KSB7XG4gIGlmICghZG9tYWluLmxlbmd0aCkgZG9tYWluID0gWzBdO1xuICBpZiAoY291bnQgPT0gbnVsbCkgY291bnQgPSAxMDtcblxuICB2YXIgc3RhcnQgPSBkb21haW5bMF0sXG4gICAgICBzdG9wID0gZG9tYWluW2RvbWFpbi5sZW5ndGggLSAxXTtcblxuICBpZiAoc3RvcCA8IHN0YXJ0KSB7IGVycm9yID0gc3RvcDsgc3RvcCA9IHN0YXJ0OyBzdGFydCA9IGVycm9yOyB9XG5cbiAgdmFyIHNwYW4gPSAoc3RvcCAtIHN0YXJ0KSB8fCAoY291bnQgPSAxLCBzdGFydCB8fCBzdG9wIHx8IDEpLFxuICAgICAgc3RlcCA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKHNwYW4gLyBjb3VudCkgLyBNYXRoLkxOMTApKSxcbiAgICAgIGVycm9yID0gc3BhbiAvIGNvdW50IC8gc3RlcDtcblxuICAvLyBGaWx0ZXIgdGlja3MgdG8gZ2V0IGNsb3NlciB0byB0aGUgZGVzaXJlZCBjb3VudC5cbiAgaWYgKGVycm9yID49IGUxMCkgc3RlcCAqPSAxMDtcbiAgZWxzZSBpZiAoZXJyb3IgPj0gZTUpIHN0ZXAgKj0gNTtcbiAgZWxzZSBpZiAoZXJyb3IgPj0gZTIpIHN0ZXAgKj0gMjtcblxuICAvLyBSb3VuZCBzdGFydCBhbmQgc3RvcCB2YWx1ZXMgdG8gc3RlcCBpbnRlcnZhbC5cbiAgcmV0dXJuIFtcbiAgICBNYXRoLmNlaWwoc3RhcnQgLyBzdGVwKSAqIHN0ZXAsXG4gICAgTWF0aC5mbG9vcihzdG9wIC8gc3RlcCkgKiBzdGVwICsgc3RlcCAvIDIsIC8vIGluY2x1c2l2ZVxuICAgIHN0ZXBcbiAgXTtcbn1cblxuZnVuY3Rpb24gdHJpbVplcm8oZiwgZGVjaW1hbCkge1xuICByZXR1cm4gZnVuY3Rpb24oeCkge1xuICAgIHZhciBzID0gZih4KSxcbiAgICAgICAgbiA9IHMuaW5kZXhPZihkZWNpbWFsKTtcbiAgICBpZiAobiA8IDApIHJldHVybiBzO1xuXG4gICAgdmFyIGlkeCA9IHJpZ2h0bW9zdERpZ2l0KHMsIG4pLFxuICAgICAgICBlbmQgPSBpZHggPCBzLmxlbmd0aCA/IHMuc2xpY2UoaWR4KSA6ICcnO1xuXG4gICAgd2hpbGUgKC0taWR4ID4gbikge1xuICAgICAgaWYgKHNbaWR4XSAhPT0gJzAnKSB7ICsraWR4OyBicmVhazsgfVxuICAgIH1cbiAgICByZXR1cm4gcy5zbGljZSgwLCBpZHgpICsgZW5kO1xuICB9O1xufVxuXG5mdW5jdGlvbiByaWdodG1vc3REaWdpdChzLCBuKSB7XG4gIHZhciBpID0gcy5sYXN0SW5kZXhPZignZScpLCBjO1xuICBpZiAoaSA+IDApIHJldHVybiBpO1xuICBmb3IgKGk9cy5sZW5ndGg7IC0taSA+IG47KSB7XG4gICAgYyA9IHMuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoYyA+PSA0OCAmJiBjIDw9IDU3KSByZXR1cm4gaSsxOyAvLyBpcyBkaWdpdFxuICB9XG59XG5cbmZ1bmN0aW9uIGF1dG9OdW1iZXJGb3JtYXQoZikge1xuICB2YXIgZGVjaW1hbCA9IG51bWJlckYuZm9ybWF0KCcuMWYnKSgxKVsxXTsgLy8gZ2V0IGRlY2ltYWwgY2hhclxuICBpZiAoZiA9PSBudWxsKSBmID0gJywnO1xuICBmID0gZDNfbnVtYmVyRi5mb3JtYXRTcGVjaWZpZXIoZik7XG4gIGlmIChmLnByZWNpc2lvbiA9PSBudWxsKSBmLnByZWNpc2lvbiA9IDEyO1xuICBzd2l0Y2ggKGYudHlwZSkge1xuICAgIGNhc2UgJyUnOiBmLnByZWNpc2lvbiAtPSAyOyBicmVhaztcbiAgICBjYXNlICdlJzogZi5wcmVjaXNpb24gLT0gMTsgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHRyaW1aZXJvKG51bWJlckYuZm9ybWF0KGYpLCBkZWNpbWFsKTtcbn1cblxuZnVuY3Rpb24gbGluZWFyTnVtYmVyRm9ybWF0KGRvbWFpbiwgY291bnQsIGYpIHtcbiAgdmFyIHJhbmdlID0gbGluZWFyUmFuZ2UoZG9tYWluLCBjb3VudCk7XG5cbiAgaWYgKGYgPT0gbnVsbCkgZiA9ICcsZic7XG5cbiAgc3dpdGNoIChmID0gZDNfbnVtYmVyRi5mb3JtYXRTcGVjaWZpZXIoZiksIGYudHlwZSkge1xuICAgIGNhc2UgJ3MnOiB7XG4gICAgICB2YXIgdmFsdWUgPSBNYXRoLm1heChNYXRoLmFicyhyYW5nZVswXSksIE1hdGguYWJzKHJhbmdlWzFdKSk7XG4gICAgICBpZiAoZi5wcmVjaXNpb24gPT0gbnVsbCkgZi5wcmVjaXNpb24gPSBkM19udW1iZXJGLnByZWNpc2lvblByZWZpeChyYW5nZVsyXSwgdmFsdWUpO1xuICAgICAgcmV0dXJuIG51bWJlckYuZm9ybWF0UHJlZml4KGYsIHZhbHVlKTtcbiAgICB9XG4gICAgY2FzZSAnJzpcbiAgICBjYXNlICdlJzpcbiAgICBjYXNlICdnJzpcbiAgICBjYXNlICdwJzpcbiAgICBjYXNlICdyJzoge1xuICAgICAgaWYgKGYucHJlY2lzaW9uID09IG51bGwpIGYucHJlY2lzaW9uID0gZDNfbnVtYmVyRi5wcmVjaXNpb25Sb3VuZChyYW5nZVsyXSwgTWF0aC5tYXgoTWF0aC5hYnMocmFuZ2VbMF0pLCBNYXRoLmFicyhyYW5nZVsxXSkpKSAtIChmLnR5cGUgPT09ICdlJyk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnZic6XG4gICAgY2FzZSAnJSc6IHtcbiAgICAgIGlmIChmLnByZWNpc2lvbiA9PSBudWxsKSBmLnByZWNpc2lvbiA9IGQzX251bWJlckYucHJlY2lzaW9uRml4ZWQocmFuZ2VbMl0pIC0gMiAqIChmLnR5cGUgPT09ICclJyk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bWJlckYuZm9ybWF0KGYpO1xufVxuXG4vLyAtLSBEYXRldGltZSBGb3JtYXR0aW5nIC0tLS1cblxuZnVuY3Rpb24gdGltZUF1dG9Gb3JtYXQoKSB7XG4gIHZhciBmID0gdGltZUYuZm9ybWF0LFxuICAgICAgZm9ybWF0TWlsbGlzZWNvbmQgPSBmKCcuJUwnKSxcbiAgICAgIGZvcm1hdFNlY29uZCA9IGYoJzolUycpLFxuICAgICAgZm9ybWF0TWludXRlID0gZignJUk6JU0nKSxcbiAgICAgIGZvcm1hdEhvdXIgPSBmKCclSSAlcCcpLFxuICAgICAgZm9ybWF0RGF5ID0gZignJWEgJWQnKSxcbiAgICAgIGZvcm1hdFdlZWsgPSBmKCclYiAlZCcpLFxuICAgICAgZm9ybWF0TW9udGggPSBmKCclQicpLFxuICAgICAgZm9ybWF0WWVhciA9IGYoJyVZJyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICB2YXIgZCA9ICtkYXRlO1xuICAgIHJldHVybiAoZDNfdGltZS5zZWNvbmQoZGF0ZSkgPCBkID8gZm9ybWF0TWlsbGlzZWNvbmRcbiAgICAgICAgOiBkM190aW1lLm1pbnV0ZShkYXRlKSA8IGQgPyBmb3JtYXRTZWNvbmRcbiAgICAgICAgOiBkM190aW1lLmhvdXIoZGF0ZSkgPCBkID8gZm9ybWF0TWludXRlXG4gICAgICAgIDogZDNfdGltZS5kYXkoZGF0ZSkgPCBkID8gZm9ybWF0SG91clxuICAgICAgICA6IGQzX3RpbWUubW9udGgoZGF0ZSkgPCBkID9cbiAgICAgICAgICAoZDNfdGltZS53ZWVrKGRhdGUpIDwgZCA/IGZvcm1hdERheSA6IGZvcm1hdFdlZWspXG4gICAgICAgIDogZDNfdGltZS55ZWFyKGRhdGUpIDwgZCA/IGZvcm1hdE1vbnRoXG4gICAgICAgIDogZm9ybWF0WWVhcikoZGF0ZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHV0Y0F1dG9Gb3JtYXQoKSB7XG4gIHZhciBmID0gdGltZUYudXRjRm9ybWF0LFxuICAgICAgZm9ybWF0TWlsbGlzZWNvbmQgPSBmKCcuJUwnKSxcbiAgICAgIGZvcm1hdFNlY29uZCA9IGYoJzolUycpLFxuICAgICAgZm9ybWF0TWludXRlID0gZignJUk6JU0nKSxcbiAgICAgIGZvcm1hdEhvdXIgPSBmKCclSSAlcCcpLFxuICAgICAgZm9ybWF0RGF5ID0gZignJWEgJWQnKSxcbiAgICAgIGZvcm1hdFdlZWsgPSBmKCclYiAlZCcpLFxuICAgICAgZm9ybWF0TW9udGggPSBmKCclQicpLFxuICAgICAgZm9ybWF0WWVhciA9IGYoJyVZJyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGUpIHtcbiAgICB2YXIgZCA9ICtkYXRlO1xuICAgIHJldHVybiAoZDNfdGltZS51dGNTZWNvbmQoZGF0ZSkgPCBkID8gZm9ybWF0TWlsbGlzZWNvbmRcbiAgICAgICAgOiBkM190aW1lLnV0Y01pbnV0ZShkYXRlKSA8IGQgPyBmb3JtYXRTZWNvbmRcbiAgICAgICAgOiBkM190aW1lLnV0Y0hvdXIoZGF0ZSkgPCBkID8gZm9ybWF0TWludXRlXG4gICAgICAgIDogZDNfdGltZS51dGNEYXkoZGF0ZSkgPCBkID8gZm9ybWF0SG91clxuICAgICAgICA6IGQzX3RpbWUudXRjTW9udGgoZGF0ZSkgPCBkID9cbiAgICAgICAgICAoZDNfdGltZS51dGNXZWVrKGRhdGUpIDwgZCA/IGZvcm1hdERheSA6IGZvcm1hdFdlZWspXG4gICAgICAgIDogZDNfdGltZS51dGNZZWFyKGRhdGUpIDwgZCA/IGZvcm1hdE1vbnRoXG4gICAgICAgIDogZm9ybWF0WWVhcikoZGF0ZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIG1vbnRoRm9ybWF0KG1vbnRoLCBhYmJyZXZpYXRlKSB7XG4gIHZhciBmID0gYWJicmV2aWF0ZSA/XG4gICAgKG1vbnRoQWJiciB8fCAobW9udGhBYmJyID0gdGltZUYuZm9ybWF0KCclYicpKSkgOlxuICAgIChtb250aEZ1bGwgfHwgKG1vbnRoRnVsbCA9IHRpbWVGLmZvcm1hdCgnJUInKSkpO1xuICByZXR1cm4gKHRtcERhdGUuc2V0TW9udGgobW9udGgpLCBmKHRtcERhdGUpKTtcbn1cblxuZnVuY3Rpb24gZGF5Rm9ybWF0KGRheSwgYWJicmV2aWF0ZSkge1xuICB2YXIgZiA9IGFiYnJldmlhdGUgP1xuICAgIChkYXlBYmJyIHx8IChkYXlBYmJyID0gdGltZUYuZm9ybWF0KCclYScpKSkgOlxuICAgIChkYXlGdWxsIHx8IChkYXlGdWxsID0gdGltZUYuZm9ybWF0KCclQScpKSk7XG4gIHJldHVybiAodG1wRGF0ZS5zZXRNb250aCgwKSwgdG1wRGF0ZS5zZXREYXRlKDIgKyBkYXkpLCBmKHRtcERhdGUpKTtcbn0iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIGdlbiA9IG1vZHVsZS5leHBvcnRzO1xuXG5nZW4ucmVwZWF0ID0gZnVuY3Rpb24odmFsLCBuKSB7XG4gIHZhciBhID0gQXJyYXkobiksIGk7XG4gIGZvciAoaT0wOyBpPG47ICsraSkgYVtpXSA9IHZhbDtcbiAgcmV0dXJuIGE7XG59O1xuXG5nZW4uemVyb3MgPSBmdW5jdGlvbihuKSB7XG4gIHJldHVybiBnZW4ucmVwZWF0KDAsIG4pO1xufTtcblxuZ2VuLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgc3RlcCA9IDE7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICBzdG9wID0gc3RhcnQ7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICB9XG4gIGlmICgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXAgPT0gSW5maW5pdHkpIHRocm93IG5ldyBFcnJvcignSW5maW5pdGUgcmFuZ2UnKTtcbiAgdmFyIHJhbmdlID0gW10sIGkgPSAtMSwgajtcbiAgaWYgKHN0ZXAgPCAwKSB3aGlsZSAoKGogPSBzdGFydCArIHN0ZXAgKiArK2kpID4gc3RvcCkgcmFuZ2UucHVzaChqKTtcbiAgZWxzZSB3aGlsZSAoKGogPSBzdGFydCArIHN0ZXAgKiArK2kpIDwgc3RvcCkgcmFuZ2UucHVzaChqKTtcbiAgcmV0dXJuIHJhbmdlO1xufTtcblxuZ2VuLnJhbmRvbSA9IHt9O1xuXG5nZW4ucmFuZG9tLnVuaWZvcm0gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICBpZiAobWF4ID09PSB1bmRlZmluZWQpIHtcbiAgICBtYXggPSBtaW4gPT09IHVuZGVmaW5lZCA/IDEgOiBtaW47XG4gICAgbWluID0gMDtcbiAgfVxuICB2YXIgZCA9IG1heCAtIG1pbjtcbiAgdmFyIGYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbWluICsgZCAqIE1hdGgucmFuZG9tKCk7XG4gIH07XG4gIGYuc2FtcGxlcyA9IGZ1bmN0aW9uKG4pIHtcbiAgICByZXR1cm4gZ2VuLnplcm9zKG4pLm1hcChmKTtcbiAgfTtcbiAgZi5wZGYgPSBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuICh4ID49IG1pbiAmJiB4IDw9IG1heCkgPyAxL2QgOiAwO1xuICB9O1xuICBmLmNkZiA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4geCA8IG1pbiA/IDAgOiB4ID4gbWF4ID8gMSA6ICh4IC0gbWluKSAvIGQ7XG4gIH07XG4gIGYuaWNkZiA9IGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gKHAgPj0gMCAmJiBwIDw9IDEpID8gbWluICsgcCpkIDogTmFOO1xuICB9O1xuICByZXR1cm4gZjtcbn07XG5cbmdlbi5yYW5kb20uaW50ZWdlciA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgaWYgKGIgPT09IHVuZGVmaW5lZCkge1xuICAgIGIgPSBhO1xuICAgIGEgPSAwO1xuICB9XG4gIHZhciBkID0gYiAtIGE7XG4gIHZhciBmID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGEgKyBNYXRoLmZsb29yKGQgKiBNYXRoLnJhbmRvbSgpKTtcbiAgfTtcbiAgZi5zYW1wbGVzID0gZnVuY3Rpb24obikge1xuICAgIHJldHVybiBnZW4uemVyb3MobikubWFwKGYpO1xuICB9O1xuICBmLnBkZiA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gKHggPT09IE1hdGguZmxvb3IoeCkgJiYgeCA+PSBhICYmIHggPCBiKSA/IDEvZCA6IDA7XG4gIH07XG4gIGYuY2RmID0gZnVuY3Rpb24oeCkge1xuICAgIHZhciB2ID0gTWF0aC5mbG9vcih4KTtcbiAgICByZXR1cm4gdiA8IGEgPyAwIDogdiA+PSBiID8gMSA6ICh2IC0gYSArIDEpIC8gZDtcbiAgfTtcbiAgZi5pY2RmID0gZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAocCA+PSAwICYmIHAgPD0gMSkgPyBhIC0gMSArIE1hdGguZmxvb3IocCpkKSA6IE5hTjtcbiAgfTtcbiAgcmV0dXJuIGY7XG59O1xuXG5nZW4ucmFuZG9tLm5vcm1hbCA9IGZ1bmN0aW9uKG1lYW4sIHN0ZGV2KSB7XG4gIG1lYW4gPSBtZWFuIHx8IDA7XG4gIHN0ZGV2ID0gc3RkZXYgfHwgMTtcbiAgdmFyIG5leHQ7XG4gIHZhciBmID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHggPSAwLCB5ID0gMCwgcmRzLCBjO1xuICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHggPSBuZXh0O1xuICAgICAgbmV4dCA9IHVuZGVmaW5lZDtcbiAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBkbyB7XG4gICAgICB4ID0gTWF0aC5yYW5kb20oKSoyLTE7XG4gICAgICB5ID0gTWF0aC5yYW5kb20oKSoyLTE7XG4gICAgICByZHMgPSB4KnggKyB5Knk7XG4gICAgfSB3aGlsZSAocmRzID09PSAwIHx8IHJkcyA+IDEpO1xuICAgIGMgPSBNYXRoLnNxcnQoLTIqTWF0aC5sb2cocmRzKS9yZHMpOyAvLyBCb3gtTXVsbGVyIHRyYW5zZm9ybVxuICAgIG5leHQgPSBtZWFuICsgeSpjKnN0ZGV2O1xuICAgIHJldHVybiBtZWFuICsgeCpjKnN0ZGV2O1xuICB9O1xuICBmLnNhbXBsZXMgPSBmdW5jdGlvbihuKSB7XG4gICAgcmV0dXJuIGdlbi56ZXJvcyhuKS5tYXAoZik7XG4gIH07XG4gIGYucGRmID0gZnVuY3Rpb24oeCkge1xuICAgIHZhciBleHAgPSBNYXRoLmV4cChNYXRoLnBvdyh4LW1lYW4sIDIpIC8gKC0yICogTWF0aC5wb3coc3RkZXYsIDIpKSk7XG4gICAgcmV0dXJuICgxIC8gKHN0ZGV2ICogTWF0aC5zcXJ0KDIqTWF0aC5QSSkpKSAqIGV4cDtcbiAgfTtcbiAgZi5jZGYgPSBmdW5jdGlvbih4KSB7XG4gICAgLy8gQXBwcm94aW1hdGlvbiBmcm9tIFdlc3QgKDIwMDkpXG4gICAgLy8gQmV0dGVyIEFwcHJveGltYXRpb25zIHRvIEN1bXVsYXRpdmUgTm9ybWFsIEZ1bmN0aW9uc1xuICAgIHZhciBjZCxcbiAgICAgICAgeiA9ICh4IC0gbWVhbikgLyBzdGRldixcbiAgICAgICAgWiA9IE1hdGguYWJzKHopO1xuICAgIGlmIChaID4gMzcpIHtcbiAgICAgIGNkID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHN1bSwgZXhwID0gTWF0aC5leHAoLVoqWi8yKTtcbiAgICAgIGlmIChaIDwgNy4wNzEwNjc4MTE4NjU0Nykge1xuICAgICAgICBzdW0gPSAzLjUyNjI0OTY1OTk4OTExZS0wMiAqIFogKyAwLjcwMDM4MzA2NDQ0MzY4ODtcbiAgICAgICAgc3VtID0gc3VtICogWiArIDYuMzczOTYyMjAzNTMxNjU7XG4gICAgICAgIHN1bSA9IHN1bSAqIFogKyAzMy45MTI4NjYwNzgzODM7XG4gICAgICAgIHN1bSA9IHN1bSAqIFogKyAxMTIuMDc5MjkxNDk3ODcxO1xuICAgICAgICBzdW0gPSBzdW0gKiBaICsgMjIxLjIxMzU5NjE2OTkzMTtcbiAgICAgICAgc3VtID0gc3VtICogWiArIDIyMC4yMDY4Njc5MTIzNzY7XG4gICAgICAgIGNkID0gZXhwICogc3VtO1xuICAgICAgICBzdW0gPSA4LjgzODgzNDc2NDgzMTg0ZS0wMiAqIFogKyAxLjc1NTY2NzE2MzE4MjY0O1xuICAgICAgICBzdW0gPSBzdW0gKiBaICsgMTYuMDY0MTc3NTc5MjA3O1xuICAgICAgICBzdW0gPSBzdW0gKiBaICsgODYuNzgwNzMyMjAyOTQ2MTtcbiAgICAgICAgc3VtID0gc3VtICogWiArIDI5Ni41NjQyNDg3Nzk2NzQ7XG4gICAgICAgIHN1bSA9IHN1bSAqIFogKyA2MzcuMzMzNjMzMzc4ODMxO1xuICAgICAgICBzdW0gPSBzdW0gKiBaICsgNzkzLjgyNjUxMjUxOTk0ODtcbiAgICAgICAgc3VtID0gc3VtICogWiArIDQ0MC40MTM3MzU4MjQ3NTI7XG4gICAgICAgIGNkID0gY2QgLyBzdW07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdW0gPSBaICsgMC42NTtcbiAgICAgICAgc3VtID0gWiArIDQgLyBzdW07XG4gICAgICAgIHN1bSA9IFogKyAzIC8gc3VtO1xuICAgICAgICBzdW0gPSBaICsgMiAvIHN1bTtcbiAgICAgICAgc3VtID0gWiArIDEgLyBzdW07XG4gICAgICAgIGNkID0gZXhwIC8gc3VtIC8gMi41MDY2MjgyNzQ2MzE7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB6ID4gMCA/IDEgLSBjZCA6IGNkO1xuICB9O1xuICBmLmljZGYgPSBmdW5jdGlvbihwKSB7XG4gICAgLy8gQXBwcm94aW1hdGlvbiBvZiBQcm9iaXQgZnVuY3Rpb24gdXNpbmcgaW52ZXJzZSBlcnJvciBmdW5jdGlvbi5cbiAgICBpZiAocCA8PSAwIHx8IHAgPj0gMSkgcmV0dXJuIE5hTjtcbiAgICB2YXIgeCA9IDIqcCAtIDEsXG4gICAgICAgIHYgPSAoOCAqIChNYXRoLlBJIC0gMykpIC8gKDMgKiBNYXRoLlBJICogKDQtTWF0aC5QSSkpLFxuICAgICAgICBhID0gKDIgLyAoTWF0aC5QSSp2KSkgKyAoTWF0aC5sb2coMSAtIE1hdGgucG93KHgsMikpIC8gMiksXG4gICAgICAgIGIgPSBNYXRoLmxvZygxIC0gKHgqeCkpIC8gdixcbiAgICAgICAgcyA9ICh4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5zcXJ0KChhKmEpIC0gYikgLSBhKTtcbiAgICByZXR1cm4gbWVhbiArIHN0ZGV2ICogTWF0aC5TUVJUMiAqIHM7XG4gIH07XG4gIHJldHVybiBmO1xufTtcblxuZ2VuLnJhbmRvbS5ib290c3RyYXAgPSBmdW5jdGlvbihkb21haW4sIHNtb290aCkge1xuICAvLyBHZW5lcmF0ZXMgYSBib290c3RyYXAgc2FtcGxlIGZyb20gYSBzZXQgb2Ygb2JzZXJ2YXRpb25zLlxuICAvLyBTbW9vdGggYm9vdHN0cmFwcGluZyBhZGRzIHJhbmRvbSB6ZXJvLWNlbnRlcmVkIG5vaXNlIHRvIHRoZSBzYW1wbGVzLlxuICB2YXIgdmFsID0gZG9tYWluLmZpbHRlcih1dGlsLmlzVmFsaWQpLFxuICAgICAgbGVuID0gdmFsLmxlbmd0aCxcbiAgICAgIGVyciA9IHNtb290aCA/IGdlbi5yYW5kb20ubm9ybWFsKDAsIHNtb290aCkgOiBudWxsO1xuICB2YXIgZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB2YWxbfn4oTWF0aC5yYW5kb20oKSpsZW4pXSArIChlcnIgPyBlcnIoKSA6IDApO1xuICB9O1xuICBmLnNhbXBsZXMgPSBmdW5jdGlvbihuKSB7XG4gICAgcmV0dXJuIGdlbi56ZXJvcyhuKS5tYXAoZik7XG4gIH07XG4gIHJldHVybiBmO1xufTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciBkM19kc3YgPSByZXF1aXJlKCdkMy1kc3YnKTtcblxuZnVuY3Rpb24gZHN2KGRhdGEsIGZvcm1hdCkge1xuICBpZiAoZGF0YSkge1xuICAgIHZhciBoID0gZm9ybWF0LmhlYWRlcjtcbiAgICBkYXRhID0gKGggPyBoLmpvaW4oZm9ybWF0LmRlbGltaXRlcikgKyAnXFxuJyA6ICcnKSArIGRhdGE7XG4gIH1cbiAgcmV0dXJuIGQzX2Rzdi5kc3YoZm9ybWF0LmRlbGltaXRlcikucGFyc2UoZGF0YSk7XG59XG5cbmRzdi5kZWxpbWl0ZXIgPSBmdW5jdGlvbihkZWxpbSkge1xuICB2YXIgZm10ID0ge2RlbGltaXRlcjogZGVsaW19O1xuICByZXR1cm4gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gICAgcmV0dXJuIGRzdihkYXRhLCBmb3JtYXQgPyB1dGlsLmV4dGVuZChmb3JtYXQsIGZtdCkgOiBmbXQpO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkc3Y7XG4iLCJ2YXIgZHN2ID0gcmVxdWlyZSgnLi9kc3YnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGpzb246IHJlcXVpcmUoJy4vanNvbicpLFxuICB0b3BvanNvbjogcmVxdWlyZSgnLi90b3BvanNvbicpLFxuICB0cmVlanNvbjogcmVxdWlyZSgnLi90cmVlanNvbicpLFxuICBkc3Y6IGRzdixcbiAgY3N2OiBkc3YuZGVsaW1pdGVyKCcsJyksXG4gIHRzdjogZHN2LmRlbGltaXRlcignXFx0Jylcbn07XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIGQgPSB1dGlsLmlzT2JqZWN0KGRhdGEpICYmICF1dGlsLmlzQnVmZmVyKGRhdGEpID9cbiAgICBkYXRhIDogSlNPTi5wYXJzZShkYXRhKTtcbiAgaWYgKGZvcm1hdCAmJiBmb3JtYXQucHJvcGVydHkpIHtcbiAgICBkID0gdXRpbC5hY2Nlc3Nvcihmb3JtYXQucHJvcGVydHkpKGQpO1xuICB9XG4gIHJldHVybiBkO1xufTtcbiIsInZhciBqc29uID0gcmVxdWlyZSgnLi9qc29uJyk7XG5cbnZhciByZWFkZXIgPSBmdW5jdGlvbihkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIHRvcG9qc29uID0gcmVhZGVyLnRvcG9qc29uO1xuICBpZiAodG9wb2pzb24gPT0gbnVsbCkgeyB0aHJvdyBFcnJvcignVG9wb0pTT04gbGlicmFyeSBub3QgbG9hZGVkLicpOyB9XG5cbiAgdmFyIHQgPSBqc29uKGRhdGEsIGZvcm1hdCksIG9iajtcblxuICBpZiAoZm9ybWF0ICYmIGZvcm1hdC5mZWF0dXJlKSB7XG4gICAgaWYgKChvYmogPSB0Lm9iamVjdHNbZm9ybWF0LmZlYXR1cmVdKSkge1xuICAgICAgcmV0dXJuIHRvcG9qc29uLmZlYXR1cmUodCwgb2JqKS5mZWF0dXJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgVG9wb0pTT04gb2JqZWN0OiAnICsgZm9ybWF0LmZlYXR1cmUpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmb3JtYXQgJiYgZm9ybWF0Lm1lc2gpIHtcbiAgICBpZiAoKG9iaiA9IHQub2JqZWN0c1tmb3JtYXQubWVzaF0pKSB7XG4gICAgICByZXR1cm4gW3RvcG9qc29uLm1lc2godCwgdC5vYmplY3RzW2Zvcm1hdC5tZXNoXSldO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBUb3BvSlNPTiBvYmplY3Q6ICcgKyBmb3JtYXQubWVzaCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKCdNaXNzaW5nIFRvcG9KU09OIGZlYXR1cmUgb3IgbWVzaCBwYXJhbWV0ZXIuJyk7XG4gIH1cbn07XG5cbnJlYWRlci50b3BvanNvbiA9IHJlcXVpcmUoJ3RvcG9qc29uJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlYWRlcjtcbiIsInZhciBqc29uID0gcmVxdWlyZSgnLi9qc29uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odHJlZSwgZm9ybWF0KSB7XG4gIHJldHVybiB0b1RhYmxlKGpzb24odHJlZSwgZm9ybWF0KSwgZm9ybWF0KTtcbn07XG5cbmZ1bmN0aW9uIHRvVGFibGUocm9vdCwgZmllbGRzKSB7XG4gIHZhciBjaGlsZHJlbkZpZWxkID0gZmllbGRzICYmIGZpZWxkcy5jaGlsZHJlbiB8fCAnY2hpbGRyZW4nLFxuICAgICAgcGFyZW50RmllbGQgPSBmaWVsZHMgJiYgZmllbGRzLnBhcmVudCB8fCAncGFyZW50JyxcbiAgICAgIHRhYmxlID0gW107XG5cbiAgZnVuY3Rpb24gdmlzaXQobm9kZSwgcGFyZW50KSB7XG4gICAgbm9kZVtwYXJlbnRGaWVsZF0gPSBwYXJlbnQ7XG4gICAgdGFibGUucHVzaChub2RlKTtcbiAgICB2YXIgY2hpbGRyZW4gPSBub2RlW2NoaWxkcmVuRmllbGRdO1xuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgZm9yICh2YXIgaT0wOyBpPGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZpc2l0KGNoaWxkcmVuW2ldLCBub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2aXNpdChyb290LCBudWxsKTtcbiAgcmV0dXJuICh0YWJsZS5yb290ID0gcm9vdCwgdGFibGUpO1xufVxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8vIE1hdGNoZXMgYWJzb2x1dGUgVVJMcyB3aXRoIG9wdGlvbmFsIHByb3RvY29sXG4vLyAgIGh0dHBzOi8vLi4uICAgIGZpbGU6Ly8uLi4gICAgLy8uLi5cbnZhciBwcm90b2NvbF9yZSA9IC9eKFtBLVphLXpdKzopP1xcL1xcLy87XG5cbi8vIFNwZWNpYWwgdHJlYXRtZW50IGluIG5vZGUuanMgZm9yIHRoZSBmaWxlOiBwcm90b2NvbFxudmFyIGZpbGVQcm90b2NvbCA9ICdmaWxlOi8vJztcblxuLy8gVmFsaWRhdGUgYW5kIGNsZWFudXAgVVJMIHRvIGVuc3VyZSB0aGF0IGl0IGlzIGFsbG93ZWQgdG8gYmUgYWNjZXNzZWRcbi8vIFJldHVybnMgY2xlYW5lZCB1cCBVUkwsIG9yIGZhbHNlIGlmIGFjY2VzcyBpcyBub3QgYWxsb3dlZFxuZnVuY3Rpb24gc2FuaXRpemVVcmwob3B0KSB7XG4gIHZhciB1cmwgPSBvcHQudXJsO1xuICBpZiAoIXVybCAmJiBvcHQuZmlsZSkgeyByZXR1cm4gZmlsZVByb3RvY29sICsgb3B0LmZpbGU7IH1cblxuICAvLyBJbiBjYXNlIHRoaXMgaXMgYSByZWxhdGl2ZSB1cmwgKGhhcyBubyBob3N0KSwgcHJlcGVuZCBvcHQuYmFzZVVSTFxuICBpZiAob3B0LmJhc2VVUkwgJiYgIXByb3RvY29sX3JlLnRlc3QodXJsKSkge1xuICAgIGlmICghc3RhcnRzV2l0aCh1cmwsICcvJykgJiYgb3B0LmJhc2VVUkxbb3B0LmJhc2VVUkwubGVuZ3RoLTFdICE9PSAnLycpIHtcbiAgICAgIHVybCA9ICcvJyArIHVybDsgLy8gRW5zdXJlIHRoYXQgdGhlcmUgaXMgYSBzbGFzaCBiZXR3ZWVuIHRoZSBiYXNlVVJMIChlLmcuIGhvc3RuYW1lKSBhbmQgdXJsXG4gICAgfVxuICAgIHVybCA9IG9wdC5iYXNlVVJMICsgdXJsO1xuICB9XG4gIC8vIHJlbGF0aXZlIHByb3RvY29sLCBzdGFydHMgd2l0aCAnLy8nXG4gIGlmICghbG9hZC51c2VYSFIgJiYgc3RhcnRzV2l0aCh1cmwsICcvLycpKSB7XG4gICAgdXJsID0gKG9wdC5kZWZhdWx0UHJvdG9jb2wgfHwgJ2h0dHAnKSArICc6JyArIHVybDtcbiAgfVxuICAvLyBJZiBvcHQuZG9tYWluV2hpdGVMaXN0IGlzIHNldCwgb25seSBhbGxvd3MgdXJsLCB3aG9zZSBob3N0bmFtZVxuICAvLyAqIElzIHRoZSBzYW1lIGFzIHRoZSBvcmlnaW4gKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSlcbiAgLy8gKiBFcXVhbHMgb25lIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIHdoaXRlbGlzdFxuICAvLyAqIElzIGEgcHJvcGVyIHN1YmRvbWFpbiBvZiBvbmUgb2YgdGhlIHZhbHVlcyBpbiB0aGUgd2hpdGVsaXN0XG4gIGlmIChvcHQuZG9tYWluV2hpdGVMaXN0KSB7XG4gICAgdmFyIGRvbWFpbiwgb3JpZ2luO1xuICAgIGlmIChsb2FkLnVzZVhIUikge1xuICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICBhLmhyZWYgPSB1cmw7XG4gICAgICAvLyBGcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzM2NTEzL2hvdy1kby1pLXBhcnNlLWEtdXJsLWludG8taG9zdG5hbWUtYW5kLXBhdGgtaW4tamF2YXNjcmlwdFxuICAgICAgLy8gSUUgZG9lc24ndCBwb3B1bGF0ZSBhbGwgbGluayBwcm9wZXJ0aWVzIHdoZW4gc2V0dGluZyAuaHJlZiB3aXRoIGEgcmVsYXRpdmUgVVJMLFxuICAgICAgLy8gaG93ZXZlciAuaHJlZiB3aWxsIHJldHVybiBhbiBhYnNvbHV0ZSBVUkwgd2hpY2ggdGhlbiBjYW4gYmUgdXNlZCBvbiBpdHNlbGZcbiAgICAgIC8vIHRvIHBvcHVsYXRlIHRoZXNlIGFkZGl0aW9uYWwgZmllbGRzLlxuICAgICAgaWYgKGEuaG9zdCA9PT0gJycpIHtcbiAgICAgICAgYS5ocmVmID0gYS5ocmVmO1xuICAgICAgfVxuICAgICAgZG9tYWluID0gYS5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgb3JpZ2luID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZWxhdGl2ZSBwcm90b2NvbCBpcyBicm9rZW46IGh0dHBzOi8vZ2l0aHViLmNvbS9kZWZ1bmN0em9tYmllL25vZGUtdXJsL2lzc3Vlcy81XG4gICAgICB2YXIgcGFydHMgPSByZXF1aXJlKCd1cmwnKS5wYXJzZSh1cmwpO1xuICAgICAgZG9tYWluID0gcGFydHMuaG9zdG5hbWU7XG4gICAgICBvcmlnaW4gPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChvcmlnaW4gIT09IGRvbWFpbikge1xuICAgICAgdmFyIHdoaXRlTGlzdGVkID0gb3B0LmRvbWFpbldoaXRlTGlzdC5zb21lKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGlkeCA9IGRvbWFpbi5sZW5ndGggLSBkLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGQgPT09IGRvbWFpbiB8fFxuICAgICAgICAgIChpZHggPiAxICYmIGRvbWFpbltpZHgtMV0gPT09ICcuJyAmJiBkb21haW4ubGFzdEluZGV4T2YoZCkgPT09IGlkeCk7XG4gICAgICB9KTtcbiAgICAgIGlmICghd2hpdGVMaXN0ZWQpIHtcbiAgICAgICAgdGhyb3cgJ1VSTCBpcyBub3Qgd2hpdGVsaXN0ZWQ6ICcgKyB1cmw7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1cmw7XG59XG5cbmZ1bmN0aW9uIGxvYWQob3B0LCBjYWxsYmFjaykge1xuICByZXR1cm4gbG9hZC5sb2FkZXIob3B0LCBjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGxvYWRlcihvcHQsIGNhbGxiYWNrKSB7XG4gIHZhciBlcnJvciA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uKGUpIHsgdGhyb3cgZTsgfSwgdXJsO1xuXG4gIHRyeSB7XG4gICAgdXJsID0gbG9hZC5zYW5pdGl6ZVVybChvcHQpOyAvLyBlbmFibGUgb3ZlcnJpZGVcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZXJyb3IoZXJyKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIXVybCkge1xuICAgIGVycm9yKCdJbnZhbGlkIFVSTDogJyArIG9wdC51cmwpO1xuICB9IGVsc2UgaWYgKGxvYWQudXNlWEhSKSB7XG4gICAgLy8gb24gY2xpZW50LCB1c2UgeGhyXG4gICAgcmV0dXJuIGxvYWQueGhyKHVybCwgb3B0LCBjYWxsYmFjayk7XG4gIH0gZWxzZSBpZiAoc3RhcnRzV2l0aCh1cmwsIGZpbGVQcm90b2NvbCkpIHtcbiAgICAvLyBvbiBzZXJ2ZXIsIGlmIHVybCBzdGFydHMgd2l0aCAnZmlsZTovLycsIHN0cmlwIGl0IGFuZCBsb2FkIGZyb20gZmlsZVxuICAgIHJldHVybiBsb2FkLmZpbGUodXJsLnNsaWNlKGZpbGVQcm90b2NvbC5sZW5ndGgpLCBvcHQsIGNhbGxiYWNrKTtcbiAgfSBlbHNlIGlmICh1cmwuaW5kZXhPZignOi8vJykgPCAwKSB7IC8vIFRPRE8gYmV0dGVyIHByb3RvY29sIGNoZWNrP1xuICAgIC8vIG9uIHNlcnZlciwgaWYgbm8gcHJvdG9jb2wgYXNzdW1lIGZpbGVcbiAgICByZXR1cm4gbG9hZC5maWxlKHVybCwgb3B0LCBjYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgLy8gZm9yIHJlZ3VsYXIgVVJMcyBvbiBzZXJ2ZXJcbiAgICByZXR1cm4gbG9hZC5odHRwKHVybCwgb3B0LCBjYWxsYmFjayk7XG4gIH1cbn1cblxuZnVuY3Rpb24geGhySGFzUmVzcG9uc2UocmVxdWVzdCkge1xuICB2YXIgdHlwZSA9IHJlcXVlc3QucmVzcG9uc2VUeXBlO1xuICByZXR1cm4gdHlwZSAmJiB0eXBlICE9PSAndGV4dCcgP1xuICAgIHJlcXVlc3QucmVzcG9uc2UgOiAvLyBudWxsIG9uIGVycm9yXG4gICAgcmVxdWVzdC5yZXNwb25zZVRleHQ7IC8vICcnIG9uIGVycm9yXG59XG5cbmZ1bmN0aW9uIHhocih1cmwsIG9wdCwgY2FsbGJhY2spIHtcbiAgdmFyIGFzeW5jID0gISFjYWxsYmFjaztcbiAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgLy8gSWYgSUUgZG9lcyBub3Qgc3VwcG9ydCBDT1JTLCB1c2UgWERvbWFpblJlcXVlc3QgKGNvcGllZCBmcm9tIGQzLnhocilcbiAgaWYgKHR5cGVvZiBYRG9tYWluUmVxdWVzdCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICEoJ3dpdGhDcmVkZW50aWFscycgaW4gcmVxdWVzdCkgJiZcbiAgICAgIC9eKGh0dHAocyk/Oik/XFwvXFwvLy50ZXN0KHVybCkpIHJlcXVlc3QgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcblxuICBmdW5jdGlvbiByZXNwb25kKCkge1xuICAgIHZhciBzdGF0dXMgPSByZXF1ZXN0LnN0YXR1cztcbiAgICBpZiAoIXN0YXR1cyAmJiB4aHJIYXNSZXNwb25zZShyZXF1ZXN0KSB8fCBzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCB8fCBzdGF0dXMgPT09IDMwNCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVxdWVzdC5yZXNwb25zZVRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhyZXF1ZXN0LCBudWxsKTtcbiAgICB9XG4gIH1cblxuICBpZiAoYXN5bmMpIHtcbiAgICBpZiAoJ29ubG9hZCcgaW4gcmVxdWVzdCkge1xuICAgICAgcmVxdWVzdC5vbmxvYWQgPSByZXF1ZXN0Lm9uZXJyb3IgPSByZXNwb25kO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAocmVxdWVzdC5yZWFkeVN0YXRlID4gMykgcmVzcG9uZCgpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICByZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCwgYXN5bmMpO1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAocmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKSB7XG4gICAgdmFyIGhlYWRlcnMgPSB1dGlsLmV4dGVuZCh7fSwgbG9hZC5oZWFkZXJzLCBvcHQuaGVhZGVycyk7XG4gICAgZm9yICh2YXIgbmFtZSBpbiBoZWFkZXJzKSB7XG4gICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgfVxuICB9XG4gIHJlcXVlc3Quc2VuZCgpO1xuXG4gIGlmICghYXN5bmMgJiYgeGhySGFzUmVzcG9uc2UocmVxdWVzdCkpIHtcbiAgICByZXR1cm4gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmlsZShmaWxlbmFtZSwgb3B0LCBjYWxsYmFjaykge1xuICB2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmaWxlbmFtZSwgJ3V0ZjgnKTtcbiAgfVxuICBmcy5yZWFkRmlsZShmaWxlbmFtZSwgY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBodHRwKHVybCwgb3B0LCBjYWxsYmFjaykge1xuICB2YXIgaGVhZGVycyA9IHV0aWwuZXh0ZW5kKHt9LCBsb2FkLmhlYWRlcnMsIG9wdC5oZWFkZXJzKTtcblxuICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ3N5bmMtcmVxdWVzdCcpKCdHRVQnLCB1cmwsIHtoZWFkZXJzOiBoZWFkZXJzfSkuZ2V0Qm9keSgpO1xuICB9XG5cbiAgdmFyIG9wdGlvbnMgPSB7dXJsOiB1cmwsIGVuY29kaW5nOiBudWxsLCBnemlwOiB0cnVlLCBoZWFkZXJzOiBoZWFkZXJzfTtcbiAgcmVxdWlyZSgncmVxdWVzdCcpKG9wdGlvbnMsIGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSwgYm9keSkge1xuICAgIGlmICghZXJyb3IgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCBib2R5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3IgPSBlcnJvciB8fFxuICAgICAgICAnTG9hZCBmYWlsZWQgd2l0aCByZXNwb25zZSBjb2RlICcgKyByZXNwb25zZS5zdGF0dXNDb2RlICsgJy4nO1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyaW5nLCBzZWFyY2hTdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZyA9PSBudWxsID8gZmFsc2UgOiBzdHJpbmcubGFzdEluZGV4T2Yoc2VhcmNoU3RyaW5nLCAwKSA9PT0gMDtcbn1cblxuLy8gQWxsb3cgdGhlc2UgZnVuY3Rpb25zIHRvIGJlIG92ZXJyaWRlbiBieSB0aGUgdXNlciBvZiB0aGUgbGlicmFyeVxubG9hZC5sb2FkZXIgPSBsb2FkZXI7XG5sb2FkLnNhbml0aXplVXJsID0gc2FuaXRpemVVcmw7XG5sb2FkLnhociA9IHhocjtcbmxvYWQuZmlsZSA9IGZpbGU7XG5sb2FkLmh0dHAgPSBodHRwO1xuXG4vLyBEZWZhdWx0IHNldHRpbmdzXG5sb2FkLnVzZVhIUiA9ICh0eXBlb2YgWE1MSHR0cFJlcXVlc3QgIT09ICd1bmRlZmluZWQnKTtcbmxvYWQuaGVhZGVycyA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWQ7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKSxcbiAgdHlwZSA9IHJlcXVpcmUoJy4vdHlwZScpLFxuICBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyksXG4gIHRpbWVGID0gcmVxdWlyZSgnLi4vZm9ybWF0JykudGltZTtcblxuZnVuY3Rpb24gcmVhZChkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIHR5cGUgPSAoZm9ybWF0ICYmIGZvcm1hdC50eXBlKSB8fCAnanNvbic7XG4gIGRhdGEgPSBmb3JtYXRzW3R5cGVdKGRhdGEsIGZvcm1hdCk7XG4gIGlmIChmb3JtYXQgJiYgZm9ybWF0LnBhcnNlKSBwYXJzZShkYXRhLCBmb3JtYXQucGFyc2UpO1xuICByZXR1cm4gZGF0YTtcbn1cblxuZnVuY3Rpb24gcGFyc2UoZGF0YSwgdHlwZXMpIHtcbiAgdmFyIGNvbHMsIHBhcnNlcnMsIGQsIGksIGosIGNsZW4sIGxlbiA9IGRhdGEubGVuZ3RoO1xuXG4gIHR5cGVzID0gKHR5cGVzPT09J2F1dG8nKSA/IHR5cGUuaW5mZXJBbGwoZGF0YSkgOiB1dGlsLmR1cGxpY2F0ZSh0eXBlcyk7XG4gIGNvbHMgPSB1dGlsLmtleXModHlwZXMpO1xuICBwYXJzZXJzID0gY29scy5tYXAoZnVuY3Rpb24oYykge1xuICAgIHZhciB0ID0gdHlwZXNbY107XG4gICAgaWYgKHQgJiYgdC5pbmRleE9mKCdkYXRlOicpID09PSAwKSB7XG4gICAgICB2YXIgcGFydHMgPSB0LnNwbGl0KCc6JywgMiksXG4gICAgICAgICAgcGF0dGVybiA9IHBhcnRzWzFdO1xuICAgICAgaWYgKChwYXR0ZXJuWzBdID09PSAnXFwnJyAmJiBwYXR0ZXJuW3BhdHRlcm4ubGVuZ3RoLTFdID09PSAnXFwnJykgfHxcbiAgICAgICAgICAocGF0dGVyblswXSA9PT0gJ1wiJyAgJiYgcGF0dGVybltwYXR0ZXJuLmxlbmd0aC0xXSA9PT0gJ1wiJykpIHtcbiAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4uc2xpY2UoMSwgLTEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0Zvcm1hdCBwYXR0ZXJuIG11c3QgYmUgcXVvdGVkOiAnICsgcGF0dGVybik7XG4gICAgICB9XG4gICAgICBwYXR0ZXJuID0gdGltZUYocGF0dGVybik7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odikgeyByZXR1cm4gcGF0dGVybi5wYXJzZSh2KTsgfTtcbiAgICB9XG4gICAgaWYgKCF0eXBlLnBhcnNlcnNbdF0pIHtcbiAgICAgIHRocm93IEVycm9yKCdJbGxlZ2FsIGZvcm1hdCBwYXR0ZXJuOiAnICsgYyArICc6JyArIHQpO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZS5wYXJzZXJzW3RdO1xuICB9KTtcblxuICBmb3IgKGk9MCwgY2xlbj1jb2xzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGQgPSBkYXRhW2ldO1xuICAgIGZvciAoaj0wOyBqPGNsZW47ICsraikge1xuICAgICAgZFtjb2xzW2pdXSA9IHBhcnNlcnNbal0oZFtjb2xzW2pdXSk7XG4gICAgfVxuICB9XG4gIHR5cGUuYW5ub3RhdGlvbihkYXRhLCB0eXBlcyk7XG59XG5cbnJlYWQuZm9ybWF0cyA9IGZvcm1hdHM7XG5tb2R1bGUuZXhwb3J0cyA9IHJlYWQ7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBsb2FkID0gcmVxdWlyZSgnLi9sb2FkJyk7XG52YXIgcmVhZCA9IHJlcXVpcmUoJy4vcmVhZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxcbiAgLmtleXMocmVhZC5mb3JtYXRzKVxuICAucmVkdWNlKGZ1bmN0aW9uKG91dCwgdHlwZSkge1xuICAgIG91dFt0eXBlXSA9IGZ1bmN0aW9uKG9wdCwgZm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgLy8gcHJvY2VzcyBhcmd1bWVudHNcbiAgICAgIGlmICh1dGlsLmlzU3RyaW5nKG9wdCkpIHsgb3B0ID0ge3VybDogb3B0fTsgfVxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIgJiYgdXRpbC5pc0Z1bmN0aW9uKGZvcm1hdCkpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBmb3JtYXQ7XG4gICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgLy8gc2V0IHVwIHJlYWQgZm9ybWF0XG4gICAgICBmb3JtYXQgPSB1dGlsLmV4dGVuZCh7cGFyc2U6ICdhdXRvJ30sIGZvcm1hdCk7XG4gICAgICBmb3JtYXQudHlwZSA9IHR5cGU7XG5cbiAgICAgIC8vIGxvYWQgZGF0YVxuICAgICAgdmFyIGRhdGEgPSBsb2FkKG9wdCwgY2FsbGJhY2sgPyBmdW5jdGlvbihlcnJvciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyb3IpIHsgY2FsbGJhY2soZXJyb3IsIG51bGwpOyByZXR1cm47IH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBkYXRhIGxvYWRlZCwgbm93IHBhcnNlIGl0IChhc3luYylcbiAgICAgICAgICBkYXRhID0gcmVhZChkYXRhLCBmb3JtYXQpO1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY2FsbGJhY2soZSwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gOiB1bmRlZmluZWQpO1xuXG4gICAgICAvLyBkYXRhIGxvYWRlZCwgbm93IHBhcnNlIGl0IChzeW5jKVxuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuIHJlYWQoZGF0YSwgZm9ybWF0KTtcbiAgICB9O1xuICAgIHJldHVybiBvdXQ7XG4gIH0sIHt9KTtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgVFlQRVMgPSAnX190eXBlc19fJztcblxudmFyIFBBUlNFUlMgPSB7XG4gIGJvb2xlYW46IHV0aWwuYm9vbGVhbixcbiAgaW50ZWdlcjogdXRpbC5udW1iZXIsXG4gIG51bWJlcjogIHV0aWwubnVtYmVyLFxuICBkYXRlOiAgICB1dGlsLmRhdGUsXG4gIHN0cmluZzogIGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHg9PT0nJyA/IG51bGwgOiB4OyB9XG59O1xuXG52YXIgVEVTVFMgPSB7XG4gIGJvb2xlYW46IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHg9PT0ndHJ1ZScgfHwgeD09PSdmYWxzZScgfHwgdXRpbC5pc0Jvb2xlYW4oeCk7IH0sXG4gIGludGVnZXI6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIFRFU1RTLm51bWJlcih4KSAmJiAoeD0reCkgPT09IH5+eDsgfSxcbiAgbnVtYmVyOiBmdW5jdGlvbih4KSB7IHJldHVybiAhaXNOYU4oK3gpICYmICF1dGlsLmlzRGF0ZSh4KTsgfSxcbiAgZGF0ZTogZnVuY3Rpb24oeCkgeyByZXR1cm4gIWlzTmFOKERhdGUucGFyc2UoeCkpOyB9XG59O1xuXG5mdW5jdGlvbiBhbm5vdGF0aW9uKGRhdGEsIHR5cGVzKSB7XG4gIGlmICghdHlwZXMpIHJldHVybiBkYXRhICYmIGRhdGFbVFlQRVNdIHx8IG51bGw7XG4gIGRhdGFbVFlQRVNdID0gdHlwZXM7XG59XG5cbmZ1bmN0aW9uIHR5cGUodmFsdWVzLCBmKSB7XG4gIHZhbHVlcyA9IHV0aWwuYXJyYXkodmFsdWVzKTtcbiAgZiA9IHV0aWwuJChmKTtcbiAgdmFyIHYsIGksIG47XG5cbiAgLy8gaWYgZGF0YSBhcnJheSBoYXMgdHlwZSBhbm5vdGF0aW9ucywgdXNlIHRoZW1cbiAgaWYgKHZhbHVlc1tUWVBFU10pIHtcbiAgICB2ID0gZih2YWx1ZXNbVFlQRVNdKTtcbiAgICBpZiAodXRpbC5pc1N0cmluZyh2KSkgcmV0dXJuIHY7XG4gIH1cblxuICBmb3IgKGk9MCwgbj12YWx1ZXMubGVuZ3RoOyAhdXRpbC5pc1ZhbGlkKHYpICYmIGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gIH1cblxuICByZXR1cm4gdXRpbC5pc0RhdGUodikgPyAnZGF0ZScgOlxuICAgIHV0aWwuaXNOdW1iZXIodikgICAgPyAnbnVtYmVyJyA6XG4gICAgdXRpbC5pc0Jvb2xlYW4odikgICA/ICdib29sZWFuJyA6XG4gICAgdXRpbC5pc1N0cmluZyh2KSAgICA/ICdzdHJpbmcnIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gdHlwZUFsbChkYXRhLCBmaWVsZHMpIHtcbiAgaWYgKCFkYXRhLmxlbmd0aCkgcmV0dXJuO1xuICBmaWVsZHMgPSBmaWVsZHMgfHwgdXRpbC5rZXlzKGRhdGFbMF0pO1xuICByZXR1cm4gZmllbGRzLnJlZHVjZShmdW5jdGlvbih0eXBlcywgZikge1xuICAgIHJldHVybiAodHlwZXNbZl0gPSB0eXBlKGRhdGEsIGYpLCB0eXBlcyk7XG4gIH0sIHt9KTtcbn1cblxuZnVuY3Rpb24gaW5mZXIodmFsdWVzLCBmKSB7XG4gIHZhbHVlcyA9IHV0aWwuYXJyYXkodmFsdWVzKTtcbiAgZiA9IHV0aWwuJChmKTtcbiAgdmFyIGksIGosIHY7XG5cbiAgLy8gdHlwZXMgdG8gdGVzdCBmb3IsIGluIHByZWNlZGVuY2Ugb3JkZXJcbiAgdmFyIHR5cGVzID0gWydib29sZWFuJywgJ2ludGVnZXInLCAnbnVtYmVyJywgJ2RhdGUnXTtcblxuICBmb3IgKGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBnZXQgbmV4dCB2YWx1ZSB0byB0ZXN0XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgLy8gdGVzdCB2YWx1ZSBhZ2FpbnN0IHJlbWFpbmluZyB0eXBlc1xuICAgIGZvciAoaj0wOyBqPHR5cGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAodXRpbC5pc1ZhbGlkKHYpICYmICFURVNUU1t0eXBlc1tqXV0odikpIHtcbiAgICAgICAgdHlwZXMuc3BsaWNlKGosIDEpO1xuICAgICAgICBqIC09IDE7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGlmIG5vIHR5cGVzIGxlZnQsIHJldHVybiAnc3RyaW5nJ1xuICAgIGlmICh0eXBlcy5sZW5ndGggPT09IDApIHJldHVybiAnc3RyaW5nJztcbiAgfVxuXG4gIHJldHVybiB0eXBlc1swXTtcbn1cblxuZnVuY3Rpb24gaW5mZXJBbGwoZGF0YSwgZmllbGRzKSB7XG4gIGZpZWxkcyA9IGZpZWxkcyB8fCB1dGlsLmtleXMoZGF0YVswXSk7XG4gIHJldHVybiBmaWVsZHMucmVkdWNlKGZ1bmN0aW9uKHR5cGVzLCBmKSB7XG4gICAgdHlwZXNbZl0gPSBpbmZlcihkYXRhLCBmKTtcbiAgICByZXR1cm4gdHlwZXM7XG4gIH0sIHt9KTtcbn1cblxudHlwZS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbjtcbnR5cGUuYWxsID0gdHlwZUFsbDtcbnR5cGUuaW5mZXIgPSBpbmZlcjtcbnR5cGUuaW5mZXJBbGwgPSBpbmZlckFsbDtcbnR5cGUucGFyc2VycyA9IFBBUlNFUlM7XG5tb2R1bGUuZXhwb3J0cyA9IHR5cGU7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgZGwgPSB7XG4gIHZlcnNpb246ICAgICcxLjYuMycsXG4gIGxvYWQ6ICAgICAgIHJlcXVpcmUoJy4vaW1wb3J0L2xvYWQnKSxcbiAgcmVhZDogICAgICAgcmVxdWlyZSgnLi9pbXBvcnQvcmVhZCcpLFxuICB0eXBlOiAgICAgICByZXF1aXJlKCcuL2ltcG9ydC90eXBlJyksXG4gIEFnZ3JlZ2F0b3I6IHJlcXVpcmUoJy4vYWdncmVnYXRlL2FnZ3JlZ2F0b3InKSxcbiAgZ3JvdXBieTogICAgcmVxdWlyZSgnLi9hZ2dyZWdhdGUvZ3JvdXBieScpLFxuICBiaW5zOiAgICAgICByZXF1aXJlKCcuL2JpbnMvYmlucycpLFxuICAkYmluOiAgICAgICByZXF1aXJlKCcuL2JpbnMvaGlzdG9ncmFtJykuJGJpbixcbiAgaGlzdG9ncmFtOiAgcmVxdWlyZSgnLi9iaW5zL2hpc3RvZ3JhbScpLmhpc3RvZ3JhbSxcbiAgZm9ybWF0OiAgICAgcmVxdWlyZSgnLi9mb3JtYXQnKSxcbiAgdGVtcGxhdGU6ICAgcmVxdWlyZSgnLi90ZW1wbGF0ZScpLFxuICB0aW1lOiAgICAgICByZXF1aXJlKCcuL3RpbWUnKVxufTtcblxudXRpbC5leHRlbmQoZGwsIHV0aWwpO1xudXRpbC5leHRlbmQoZGwsIHJlcXVpcmUoJy4vYWNjZXNzb3InKSk7XG51dGlsLmV4dGVuZChkbCwgcmVxdWlyZSgnLi9nZW5lcmF0ZScpKTtcbnV0aWwuZXh0ZW5kKGRsLCByZXF1aXJlKCcuL3N0YXRzJykpO1xudXRpbC5leHRlbmQoZGwsIHJlcXVpcmUoJy4vaW1wb3J0L3JlYWRlcnMnKSk7XG51dGlsLmV4dGVuZChkbC5mb3JtYXQsIHJlcXVpcmUoJy4vZm9ybWF0LXRhYmxlcycpKTtcblxuLy8gYmFja3dhcmRzLWNvbXBhdGlibGUsIGRlcHJlY2F0ZWQgQVBJXG4vLyB3aWxsIHJlbW92ZSBpbiB0aGUgZnV0dXJlXG5kbC5wcmludCA9IHtcbiAgdGFibGU6ICAgZGwuZm9ybWF0LnRhYmxlLFxuICBzdW1tYXJ5OiBkbC5mb3JtYXQuc3VtbWFyeVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkbDtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgdHlwZSA9IHJlcXVpcmUoJy4vaW1wb3J0L3R5cGUnKTtcbnZhciBnZW4gPSByZXF1aXJlKCcuL2dlbmVyYXRlJyk7XG5cbnZhciBzdGF0cyA9IG1vZHVsZS5leHBvcnRzO1xuXG4vLyBDb2xsZWN0IHVuaXF1ZSB2YWx1ZXMuXG4vLyBPdXRwdXQ6IGFuIGFycmF5IG9mIHVuaXF1ZSB2YWx1ZXMsIGluIGZpcnN0LW9ic2VydmVkIG9yZGVyXG5zdGF0cy51bmlxdWUgPSBmdW5jdGlvbih2YWx1ZXMsIGYsIHJlc3VsdHMpIHtcbiAgZiA9IHV0aWwuJChmKTtcbiAgcmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG4gIHZhciB1ID0ge30sIHYsIGksIG47XG4gIGZvciAoaT0wLCBuPXZhbHVlcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgaW4gdSkgY29udGludWU7XG4gICAgdVt2XSA9IDE7XG4gICAgcmVzdWx0cy5wdXNoKHYpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufTtcblxuLy8gUmV0dXJuIHRoZSBsZW5ndGggb2YgdGhlIGlucHV0IGFycmF5Llxuc3RhdHMuY291bnQgPSBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgcmV0dXJuIHZhbHVlcyAmJiB2YWx1ZXMubGVuZ3RoIHx8IDA7XG59O1xuXG4vLyBDb3VudCB0aGUgbnVtYmVyIG9mIG5vbi1udWxsLCBub24tdW5kZWZpbmVkLCBub24tTmFOIHZhbHVlcy5cbnN0YXRzLmNvdW50LnZhbGlkID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGYgPSB1dGlsLiQoZik7XG4gIHZhciB2LCBpLCBuLCB2YWxpZCA9IDA7XG4gIGZvciAoaT0wLCBuPXZhbHVlcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHV0aWwuaXNWYWxpZCh2KSkgdmFsaWQgKz0gMTtcbiAgfVxuICByZXR1cm4gdmFsaWQ7XG59O1xuXG4vLyBDb3VudCB0aGUgbnVtYmVyIG9mIG51bGwgb3IgdW5kZWZpbmVkIHZhbHVlcy5cbnN0YXRzLmNvdW50Lm1pc3NpbmcgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgZiA9IHV0aWwuJChmKTtcbiAgdmFyIHYsIGksIG4sIGNvdW50ID0gMDtcbiAgZm9yIChpPTAsIG49dmFsdWVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiA9PSBudWxsKSBjb3VudCArPSAxO1xuICB9XG4gIHJldHVybiBjb3VudDtcbn07XG5cbi8vIENvdW50IHRoZSBudW1iZXIgb2YgZGlzdGluY3QgdmFsdWVzLlxuLy8gTnVsbCwgdW5kZWZpbmVkIGFuZCBOYU4gYXJlIGVhY2ggY29uc2lkZXJlZCBkaXN0aW5jdCB2YWx1ZXMuXG5zdGF0cy5jb3VudC5kaXN0aW5jdCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBmID0gdXRpbC4kKGYpO1xuICB2YXIgdSA9IHt9LCB2LCBpLCBuLCBjb3VudCA9IDA7XG4gIGZvciAoaT0wLCBuPXZhbHVlcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgaW4gdSkgY29udGludWU7XG4gICAgdVt2XSA9IDE7XG4gICAgY291bnQgKz0gMTtcbiAgfVxuICByZXR1cm4gY291bnQ7XG59O1xuXG4vLyBDb25zdHJ1Y3QgYSBtYXAgZnJvbSBkaXN0aW5jdCB2YWx1ZXMgdG8gb2NjdXJyZW5jZSBjb3VudHMuXG5zdGF0cy5jb3VudC5tYXAgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgZiA9IHV0aWwuJChmKTtcbiAgdmFyIG1hcCA9IHt9LCB2LCBpLCBuO1xuICBmb3IgKGk9MCwgbj12YWx1ZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIG1hcFt2XSA9ICh2IGluIG1hcCkgPyBtYXBbdl0gKyAxIDogMTtcbiAgfVxuICByZXR1cm4gbWFwO1xufTtcblxuLy8gQ29tcHV0ZSB0aGUgbWVkaWFuIG9mIGFuIGFycmF5IG9mIG51bWJlcnMuXG5zdGF0cy5tZWRpYW4gPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKGYpIHZhbHVlcyA9IHZhbHVlcy5tYXAodXRpbC4kKGYpKTtcbiAgdmFsdWVzID0gdmFsdWVzLmZpbHRlcih1dGlsLmlzVmFsaWQpLnNvcnQodXRpbC5jbXApO1xuICByZXR1cm4gc3RhdHMucXVhbnRpbGUodmFsdWVzLCAwLjUpO1xufTtcblxuLy8gQ29tcHV0ZXMgdGhlIHF1YXJ0aWxlIGJvdW5kYXJpZXMgb2YgYW4gYXJyYXkgb2YgbnVtYmVycy5cbnN0YXRzLnF1YXJ0aWxlID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmIChmKSB2YWx1ZXMgPSB2YWx1ZXMubWFwKHV0aWwuJChmKSk7XG4gIHZhbHVlcyA9IHZhbHVlcy5maWx0ZXIodXRpbC5pc1ZhbGlkKS5zb3J0KHV0aWwuY21wKTtcbiAgdmFyIHEgPSBzdGF0cy5xdWFudGlsZTtcbiAgcmV0dXJuIFtxKHZhbHVlcywgMC4yNSksIHEodmFsdWVzLCAwLjUwKSwgcSh2YWx1ZXMsIDAuNzUpXTtcbn07XG5cbi8vIENvbXB1dGUgdGhlIHF1YW50aWxlIG9mIGEgc29ydGVkIGFycmF5IG9mIG51bWJlcnMuXG4vLyBBZGFwdGVkIGZyb20gdGhlIEQzLmpzIGltcGxlbWVudGF0aW9uLlxuc3RhdHMucXVhbnRpbGUgPSBmdW5jdGlvbih2YWx1ZXMsIGYsIHApIHtcbiAgaWYgKHAgPT09IHVuZGVmaW5lZCkgeyBwID0gZjsgZiA9IHV0aWwuaWRlbnRpdHk7IH1cbiAgZiA9IHV0aWwuJChmKTtcbiAgdmFyIEggPSAodmFsdWVzLmxlbmd0aCAtIDEpICogcCArIDEsXG4gICAgICBoID0gTWF0aC5mbG9vcihIKSxcbiAgICAgIHYgPSArZih2YWx1ZXNbaCAtIDFdKSxcbiAgICAgIGUgPSBIIC0gaDtcbiAgcmV0dXJuIGUgPyB2ICsgZSAqIChmKHZhbHVlc1toXSkgLSB2KSA6IHY7XG59O1xuXG4vLyBDb21wdXRlIHRoZSBzdW0gb2YgYW4gYXJyYXkgb2YgbnVtYmVycy5cbnN0YXRzLnN1bSA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBmID0gdXRpbC4kKGYpO1xuICBmb3IgKHZhciBzdW09MCwgaT0wLCBuPXZhbHVlcy5sZW5ndGgsIHY7IGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHV0aWwuaXNWYWxpZCh2KSkgc3VtICs9IHY7XG4gIH1cbiAgcmV0dXJuIHN1bTtcbn07XG5cbi8vIENvbXB1dGUgdGhlIG1lYW4gKGF2ZXJhZ2UpIG9mIGFuIGFycmF5IG9mIG51bWJlcnMuXG5zdGF0cy5tZWFuID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGYgPSB1dGlsLiQoZik7XG4gIHZhciBtZWFuID0gMCwgZGVsdGEsIGksIG4sIGMsIHY7XG4gIGZvciAoaT0wLCBjPTAsIG49dmFsdWVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodXRpbC5pc1ZhbGlkKHYpKSB7XG4gICAgICBkZWx0YSA9IHYgLSBtZWFuO1xuICAgICAgbWVhbiA9IG1lYW4gKyBkZWx0YSAvICgrK2MpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVhbjtcbn07XG5cbi8vIENvbXB1dGUgdGhlIGdlb21ldHJpYyBtZWFuIG9mIGFuIGFycmF5IG9mIG51bWJlcnMuXG5zdGF0cy5tZWFuLmdlb21ldHJpYyA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBmID0gdXRpbC4kKGYpO1xuICB2YXIgbWVhbiA9IDEsIGMsIG4sIHYsIGk7XG4gIGZvciAoaT0wLCBjPTAsIG49dmFsdWVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodXRpbC5pc1ZhbGlkKHYpKSB7XG4gICAgICBpZiAodiA8PSAwKSB7XG4gICAgICAgIHRocm93IEVycm9yKFwiR2VvbWV0cmljIG1lYW4gb25seSBkZWZpbmVkIGZvciBwb3NpdGl2ZSB2YWx1ZXMuXCIpO1xuICAgICAgfVxuICAgICAgbWVhbiAqPSB2O1xuICAgICAgKytjO1xuICAgIH1cbiAgfVxuICBtZWFuID0gYyA+IDAgPyBNYXRoLnBvdyhtZWFuLCAxL2MpIDogMDtcbiAgcmV0dXJuIG1lYW47XG59O1xuXG4vLyBDb21wdXRlIHRoZSBoYXJtb25pYyBtZWFuIG9mIGFuIGFycmF5IG9mIG51bWJlcnMuXG5zdGF0cy5tZWFuLmhhcm1vbmljID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGYgPSB1dGlsLiQoZik7XG4gIHZhciBtZWFuID0gMCwgYywgbiwgdiwgaTtcbiAgZm9yIChpPTAsIGM9MCwgbj12YWx1ZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh1dGlsLmlzVmFsaWQodikpIHtcbiAgICAgIG1lYW4gKz0gMS92O1xuICAgICAgKytjO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYyAvIG1lYW47XG59O1xuXG4vLyBDb21wdXRlIHRoZSBzYW1wbGUgdmFyaWFuY2Ugb2YgYW4gYXJyYXkgb2YgbnVtYmVycy5cbnN0YXRzLnZhcmlhbmNlID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGYgPSB1dGlsLiQoZik7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aCA8IDIpIHJldHVybiAwO1xuICB2YXIgbWVhbiA9IDAsIE0yID0gMCwgZGVsdGEsIGksIGMsIHY7XG4gIGZvciAoaT0wLCBjPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHV0aWwuaXNWYWxpZCh2KSkge1xuICAgICAgZGVsdGEgPSB2IC0gbWVhbjtcbiAgICAgIG1lYW4gPSBtZWFuICsgZGVsdGEgLyAoKytjKTtcbiAgICAgIE0yID0gTTIgKyBkZWx0YSAqICh2IC0gbWVhbik7XG4gICAgfVxuICB9XG4gIE0yID0gTTIgLyAoYyAtIDEpO1xuICByZXR1cm4gTTI7XG59O1xuXG4vLyBDb21wdXRlIHRoZSBzYW1wbGUgc3RhbmRhcmQgZGV2aWF0aW9uIG9mIGFuIGFycmF5IG9mIG51bWJlcnMuXG5zdGF0cy5zdGRldiA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICByZXR1cm4gTWF0aC5zcXJ0KHN0YXRzLnZhcmlhbmNlKHZhbHVlcywgZikpO1xufTtcblxuLy8gQ29tcHV0ZSB0aGUgUGVhcnNvbiBtb2RlIHNrZXduZXNzICgobWVkaWFuLW1lYW4pL3N0ZGV2KSBvZiBhbiBhcnJheSBvZiBudW1iZXJzLlxuc3RhdHMubW9kZXNrZXcgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgdmFyIGF2ZyA9IHN0YXRzLm1lYW4odmFsdWVzLCBmKSxcbiAgICAgIG1lZCA9IHN0YXRzLm1lZGlhbih2YWx1ZXMsIGYpLFxuICAgICAgc3RkID0gc3RhdHMuc3RkZXYodmFsdWVzLCBmKTtcbiAgcmV0dXJuIHN0ZCA9PT0gMCA/IDAgOiAoYXZnIC0gbWVkKSAvIHN0ZDtcbn07XG5cbi8vIEZpbmQgdGhlIG1pbmltdW0gdmFsdWUgaW4gYW4gYXJyYXkuXG5zdGF0cy5taW4gPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgcmV0dXJuIHN0YXRzLmV4dGVudCh2YWx1ZXMsIGYpWzBdO1xufTtcblxuLy8gRmluZCB0aGUgbWF4aW11bSB2YWx1ZSBpbiBhbiBhcnJheS5cbnN0YXRzLm1heCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICByZXR1cm4gc3RhdHMuZXh0ZW50KHZhbHVlcywgZilbMV07XG59O1xuXG4vLyBGaW5kIHRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIG9mIGFuIGFycmF5IG9mIHZhbHVlcy5cbnN0YXRzLmV4dGVudCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBmID0gdXRpbC4kKGYpO1xuICB2YXIgYSwgYiwgdiwgaSwgbiA9IHZhbHVlcy5sZW5ndGg7XG4gIGZvciAoaT0wOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh1dGlsLmlzVmFsaWQodikpIHsgYSA9IGIgPSB2OyBicmVhazsgfVxuICB9XG4gIGZvciAoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh1dGlsLmlzVmFsaWQodikpIHtcbiAgICAgIGlmICh2IDwgYSkgYSA9IHY7XG4gICAgICBpZiAodiA+IGIpIGIgPSB2O1xuICAgIH1cbiAgfVxuICByZXR1cm4gW2EsIGJdO1xufTtcblxuLy8gRmluZCB0aGUgaW50ZWdlciBpbmRpY2VzIG9mIHRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIHZhbHVlcy5cbnN0YXRzLmV4dGVudC5pbmRleCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBmID0gdXRpbC4kKGYpO1xuICB2YXIgeCA9IC0xLCB5ID0gLTEsIGEsIGIsIHYsIGksIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICBmb3IgKGk9MDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodXRpbC5pc1ZhbGlkKHYpKSB7IGEgPSBiID0gdjsgeCA9IHkgPSBpOyBicmVhazsgfVxuICB9XG4gIGZvciAoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh1dGlsLmlzVmFsaWQodikpIHtcbiAgICAgIGlmICh2IDwgYSkgeyBhID0gdjsgeCA9IGk7IH1cbiAgICAgIGlmICh2ID4gYikgeyBiID0gdjsgeSA9IGk7IH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIFt4LCB5XTtcbn07XG5cbi8vIENvbXB1dGUgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byBhcnJheXMgb2YgbnVtYmVycy5cbnN0YXRzLmRvdCA9IGZ1bmN0aW9uKHZhbHVlcywgYSwgYikge1xuICB2YXIgc3VtID0gMCwgaSwgdjtcbiAgaWYgKCFiKSB7XG4gICAgaWYgKHZhbHVlcy5sZW5ndGggIT09IGEubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcignQXJyYXkgbGVuZ3RocyBtdXN0IG1hdGNoLicpO1xuICAgIH1cbiAgICBmb3IgKGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHYgPSB2YWx1ZXNbaV0gKiBhW2ldO1xuICAgICAgaWYgKHYgPT09IHYpIHN1bSArPSB2O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhID0gdXRpbC4kKGEpO1xuICAgIGIgPSB1dGlsLiQoYik7XG4gICAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2ID0gYSh2YWx1ZXNbaV0pICogYih2YWx1ZXNbaV0pO1xuICAgICAgaWYgKHYgPT09IHYpIHN1bSArPSB2O1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3VtO1xufTtcblxuLy8gQ29tcHV0ZSB0aGUgdmVjdG9yIGRpc3RhbmNlIGJldHdlZW4gdHdvIGFycmF5cyBvZiBudW1iZXJzLlxuLy8gRGVmYXVsdCBpcyBFdWNsaWRlYW4gKGV4cD0yKSBkaXN0YW5jZSwgY29uZmlndXJhYmxlIHZpYSBleHAgYXJndW1lbnQuXG5zdGF0cy5kaXN0ID0gZnVuY3Rpb24odmFsdWVzLCBhLCBiLCBleHApIHtcbiAgdmFyIGYgPSB1dGlsLmlzRnVuY3Rpb24oYikgfHwgdXRpbC5pc1N0cmluZyhiKSxcbiAgICAgIFggPSB2YWx1ZXMsXG4gICAgICBZID0gZiA/IHZhbHVlcyA6IGEsXG4gICAgICBlID0gZiA/IGV4cCA6IGIsXG4gICAgICBMMiA9IGUgPT09IDIgfHwgZSA9PSBudWxsLFxuICAgICAgbiA9IHZhbHVlcy5sZW5ndGgsIHMgPSAwLCBkLCBpO1xuICBpZiAoZikge1xuICAgIGEgPSB1dGlsLiQoYSk7XG4gICAgYiA9IHV0aWwuJChiKTtcbiAgfVxuICBmb3IgKGk9MDsgaTxuOyArK2kpIHtcbiAgICBkID0gZiA/IChhKFhbaV0pLWIoWVtpXSkpIDogKFhbaV0tWVtpXSk7XG4gICAgcyArPSBMMiA/IGQqZCA6IE1hdGgucG93KE1hdGguYWJzKGQpLCBlKTtcbiAgfVxuICByZXR1cm4gTDIgPyBNYXRoLnNxcnQocykgOiBNYXRoLnBvdyhzLCAxL2UpO1xufTtcblxuLy8gQ29tcHV0ZSB0aGUgQ29oZW4ncyBkIGVmZmVjdCBzaXplIGJldHdlZW4gdHdvIGFycmF5cyBvZiBudW1iZXJzLlxuc3RhdHMuY29oZW5zZCA9IGZ1bmN0aW9uKHZhbHVlcywgYSwgYikge1xuICB2YXIgWCA9IGIgPyB2YWx1ZXMubWFwKHV0aWwuJChhKSkgOiB2YWx1ZXMsXG4gICAgICBZID0gYiA/IHZhbHVlcy5tYXAodXRpbC4kKGIpKSA6IGEsXG4gICAgICB4MSA9IHN0YXRzLm1lYW4oWCksXG4gICAgICB4MiA9IHN0YXRzLm1lYW4oWSksXG4gICAgICBuMSA9IHN0YXRzLmNvdW50LnZhbGlkKFgpLFxuICAgICAgbjIgPSBzdGF0cy5jb3VudC52YWxpZChZKTtcblxuICBpZiAoKG4xK24yLTIpIDw9IDApIHtcbiAgICAvLyBpZiBib3RoIGFycmF5cyBhcmUgc2l6ZSAxLCBvciBvbmUgaXMgZW1wdHksIHRoZXJlJ3Mgbm8gZWZmZWN0IHNpemVcbiAgICByZXR1cm4gMDtcbiAgfVxuICAvLyBwb29sIHN0YW5kYXJkIGRldmlhdGlvblxuICB2YXIgczEgPSBzdGF0cy52YXJpYW5jZShYKSxcbiAgICAgIHMyID0gc3RhdHMudmFyaWFuY2UoWSksXG4gICAgICBzID0gTWF0aC5zcXJ0KCgoKG4xLTEpKnMxKSArICgobjItMSkqczIpKSAvIChuMStuMi0yKSk7XG4gIC8vIGlmIHRoZXJlIGlzIG5vIHZhcmlhbmNlLCB0aGVyZSdzIG5vIGVmZmVjdCBzaXplXG4gIHJldHVybiBzPT09MCA/IDAgOiAoeDEgLSB4MikgLyBzO1xufTtcblxuLy8gQ29tcHV0ZXMgdGhlIGNvdmFyaWFuY2UgYmV0d2VlbiB0d28gYXJyYXlzIG9mIG51bWJlcnNcbnN0YXRzLmNvdmFyaWFuY2UgPSBmdW5jdGlvbih2YWx1ZXMsIGEsIGIpIHtcbiAgdmFyIFggPSBiID8gdmFsdWVzLm1hcCh1dGlsLiQoYSkpIDogdmFsdWVzLFxuICAgICAgWSA9IGIgPyB2YWx1ZXMubWFwKHV0aWwuJChiKSkgOiBhLFxuICAgICAgbiA9IFgubGVuZ3RoLFxuICAgICAgeG0gPSBzdGF0cy5tZWFuKFgpLFxuICAgICAgeW0gPSBzdGF0cy5tZWFuKFkpLFxuICAgICAgc3VtID0gMCwgYyA9IDAsIGksIHgsIHksIHZ4LCB2eTtcblxuICBpZiAobiAhPT0gWS5sZW5ndGgpIHtcbiAgICB0aHJvdyBFcnJvcignSW5wdXQgbGVuZ3RocyBtdXN0IG1hdGNoLicpO1xuICB9XG5cbiAgZm9yIChpPTA7IGk8bjsgKytpKSB7XG4gICAgeCA9IFhbaV07IHZ4ID0gdXRpbC5pc1ZhbGlkKHgpO1xuICAgIHkgPSBZW2ldOyB2eSA9IHV0aWwuaXNWYWxpZCh5KTtcbiAgICBpZiAodnggJiYgdnkpIHtcbiAgICAgIHN1bSArPSAoeC14bSkgKiAoeS15bSk7XG4gICAgICArK2M7XG4gICAgfSBlbHNlIGlmICh2eCB8fCB2eSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ1ZhbGlkIHZhbHVlcyBtdXN0IGFsaWduLicpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3VtIC8gKGMtMSk7XG59O1xuXG4vLyBDb21wdXRlIGFzY2VuZGluZyByYW5rIHNjb3JlcyBmb3IgYW4gYXJyYXkgb2YgdmFsdWVzLlxuLy8gVGllcyBhcmUgYXNzaWduZWQgdGhlaXIgY29sbGVjdGl2ZSBtZWFuIHJhbmsuXG5zdGF0cy5yYW5rID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGYgPSB1dGlsLiQoZikgfHwgdXRpbC5pZGVudGl0eTtcbiAgdmFyIGEgPSB2YWx1ZXMubWFwKGZ1bmN0aW9uKHYsIGkpIHtcbiAgICAgIHJldHVybiB7aWR4OiBpLCB2YWw6IGYodil9O1xuICAgIH0pXG4gICAgLnNvcnQodXRpbC5jb21wYXJhdG9yKCd2YWwnKSk7XG5cbiAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoLFxuICAgICAgciA9IEFycmF5KG4pLFxuICAgICAgdGllID0gLTEsIHAgPSB7fSwgaSwgdiwgbXU7XG5cbiAgZm9yIChpPTA7IGk8bjsgKytpKSB7XG4gICAgdiA9IGFbaV0udmFsO1xuICAgIGlmICh0aWUgPCAwICYmIHAgPT09IHYpIHtcbiAgICAgIHRpZSA9IGkgLSAxO1xuICAgIH0gZWxzZSBpZiAodGllID4gLTEgJiYgcCAhPT0gdikge1xuICAgICAgbXUgPSAxICsgKGktMSArIHRpZSkgLyAyO1xuICAgICAgZm9yICg7IHRpZTxpOyArK3RpZSkgclthW3RpZV0uaWR4XSA9IG11O1xuICAgICAgdGllID0gLTE7XG4gICAgfVxuICAgIHJbYVtpXS5pZHhdID0gaSArIDE7XG4gICAgcCA9IHY7XG4gIH1cblxuICBpZiAodGllID4gLTEpIHtcbiAgICBtdSA9IDEgKyAobi0xICsgdGllKSAvIDI7XG4gICAgZm9yICg7IHRpZTxuOyArK3RpZSkgclthW3RpZV0uaWR4XSA9IG11O1xuICB9XG5cbiAgcmV0dXJuIHI7XG59O1xuXG4vLyBDb21wdXRlIHRoZSBzYW1wbGUgUGVhcnNvbiBwcm9kdWN0LW1vbWVudCBjb3JyZWxhdGlvbiBvZiB0d28gYXJyYXlzIG9mIG51bWJlcnMuXG5zdGF0cy5jb3IgPSBmdW5jdGlvbih2YWx1ZXMsIGEsIGIpIHtcbiAgdmFyIGZuID0gYjtcbiAgYiA9IGZuID8gdmFsdWVzLm1hcCh1dGlsLiQoYikpIDogYTtcbiAgYSA9IGZuID8gdmFsdWVzLm1hcCh1dGlsLiQoYSkpIDogdmFsdWVzO1xuXG4gIHZhciBkb3QgPSBzdGF0cy5kb3QoYSwgYiksXG4gICAgICBtdWEgPSBzdGF0cy5tZWFuKGEpLFxuICAgICAgbXViID0gc3RhdHMubWVhbihiKSxcbiAgICAgIHNkYSA9IHN0YXRzLnN0ZGV2KGEpLFxuICAgICAgc2RiID0gc3RhdHMuc3RkZXYoYiksXG4gICAgICBuID0gdmFsdWVzLmxlbmd0aDtcblxuICByZXR1cm4gKGRvdCAtIG4qbXVhKm11YikgLyAoKG4tMSkgKiBzZGEgKiBzZGIpO1xufTtcblxuLy8gQ29tcHV0ZSB0aGUgU3BlYXJtYW4gcmFuayBjb3JyZWxhdGlvbiBvZiB0d28gYXJyYXlzIG9mIHZhbHVlcy5cbnN0YXRzLmNvci5yYW5rID0gZnVuY3Rpb24odmFsdWVzLCBhLCBiKSB7XG4gIHZhciByYSA9IGIgPyBzdGF0cy5yYW5rKHZhbHVlcywgYSkgOiBzdGF0cy5yYW5rKHZhbHVlcyksXG4gICAgICByYiA9IGIgPyBzdGF0cy5yYW5rKHZhbHVlcywgYikgOiBzdGF0cy5yYW5rKGEpLFxuICAgICAgbiA9IHZhbHVlcy5sZW5ndGgsIGksIHMsIGQ7XG5cbiAgZm9yIChpPTAsIHM9MDsgaTxuOyArK2kpIHtcbiAgICBkID0gcmFbaV0gLSByYltpXTtcbiAgICBzICs9IGQgKiBkO1xuICB9XG5cbiAgcmV0dXJuIDEgLSA2KnMgLyAobiAqIChuKm4tMSkpO1xufTtcblxuLy8gQ29tcHV0ZSB0aGUgZGlzdGFuY2UgY29ycmVsYXRpb24gb2YgdHdvIGFycmF5cyBvZiBudW1iZXJzLlxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9EaXN0YW5jZV9jb3JyZWxhdGlvblxuc3RhdHMuY29yLmRpc3QgPSBmdW5jdGlvbih2YWx1ZXMsIGEsIGIpIHtcbiAgdmFyIFggPSBiID8gdmFsdWVzLm1hcCh1dGlsLiQoYSkpIDogdmFsdWVzLFxuICAgICAgWSA9IGIgPyB2YWx1ZXMubWFwKHV0aWwuJChiKSkgOiBhO1xuXG4gIHZhciBBID0gc3RhdHMuZGlzdC5tYXQoWCksXG4gICAgICBCID0gc3RhdHMuZGlzdC5tYXQoWSksXG4gICAgICBuID0gQS5sZW5ndGgsXG4gICAgICBpLCBhYSwgYmIsIGFiO1xuXG4gIGZvciAoaT0wLCBhYT0wLCBiYj0wLCBhYj0wOyBpPG47ICsraSkge1xuICAgIGFhICs9IEFbaV0qQVtpXTtcbiAgICBiYiArPSBCW2ldKkJbaV07XG4gICAgYWIgKz0gQVtpXSpCW2ldO1xuICB9XG5cbiAgcmV0dXJuIE1hdGguc3FydChhYiAvIE1hdGguc3FydChhYSpiYikpO1xufTtcblxuLy8gU2ltcGxlIGxpbmVhciByZWdyZXNzaW9uLlxuLy8gUmV0dXJucyBhIFwiZml0XCIgb2JqZWN0IHdpdGggc2xvcGUgKG0pLCBpbnRlcmNlcHQgKGIpLFxuLy8gciB2YWx1ZSAoUiksIGFuZCBzdW0tc3F1YXJlZCByZXNpZHVhbCBlcnJvciAocnNzKS5cbnN0YXRzLmxpbmVhclJlZ3Jlc3Npb24gPSBmdW5jdGlvbih2YWx1ZXMsIGEsIGIpIHtcbiAgdmFyIFggPSBiID8gdmFsdWVzLm1hcCh1dGlsLiQoYSkpIDogdmFsdWVzLFxuICAgICAgWSA9IGIgPyB2YWx1ZXMubWFwKHV0aWwuJChiKSkgOiBhLFxuICAgICAgbiA9IFgubGVuZ3RoLFxuICAgICAgeHkgPSBzdGF0cy5jb3ZhcmlhbmNlKFgsIFkpLCAvLyB3aWxsIHRocm93IGVyciBpZiB2YWxpZCB2YWxzIGRvbid0IGFsaWduXG4gICAgICBzeCA9IHN0YXRzLnN0ZGV2KFgpLFxuICAgICAgc3kgPSBzdGF0cy5zdGRldihZKSxcbiAgICAgIHNsb3BlID0geHkgLyAoc3gqc3gpLFxuICAgICAgaWNlcHQgPSBzdGF0cy5tZWFuKFkpIC0gc2xvcGUgKiBzdGF0cy5tZWFuKFgpLFxuICAgICAgZml0ID0ge3Nsb3BlOiBzbG9wZSwgaW50ZXJjZXB0OiBpY2VwdCwgUjogeHkgLyAoc3gqc3kpLCByc3M6IDB9LFxuICAgICAgcmVzLCBpO1xuXG4gIGZvciAoaT0wOyBpPG47ICsraSkge1xuICAgIGlmICh1dGlsLmlzVmFsaWQoWFtpXSkgJiYgdXRpbC5pc1ZhbGlkKFlbaV0pKSB7XG4gICAgICByZXMgPSAoc2xvcGUqWFtpXSArIGljZXB0KSAtIFlbaV07XG4gICAgICBmaXQucnNzICs9IHJlcyAqIHJlcztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZml0O1xufTtcblxuLy8gTmFtZXNwYWNlIGZvciBib290c3RyYXBcbnN0YXRzLmJvb3RzdHJhcCA9IHt9O1xuXG4vLyBDb25zdHJ1Y3QgYSBib290c3RyYXBwZWQgY29uZmlkZW5jZSBpbnRlcnZhbCBhdCBhIGdpdmVuIHBlcmNlbnRpbGUgbGV2ZWxcbi8vIEFyZ3VtZW50cyBhcmUgYW4gYXJyYXksIGFuIG9wdGlvbmFsIG4gKGRlZmF1bHRzIHRvIDEwMDApLFxuLy8gIGFuIG9wdGlvbmFsIGFscGhhIChkZWZhdWx0cyB0byAwLjA1KSwgYW5kIGFuIG9wdGlvbmFsIHNtb290aGluZyBwYXJhbWV0ZXJcbnN0YXRzLmJvb3RzdHJhcC5jaSA9IGZ1bmN0aW9uKHZhbHVlcywgYSwgYiwgYywgZCkge1xuICB2YXIgWCwgTiwgYWxwaGEsIHNtb290aCwgYnMsIG1lYW5zLCBpO1xuICBpZiAodXRpbC5pc0Z1bmN0aW9uKGEpIHx8IHV0aWwuaXNTdHJpbmcoYSkpIHtcbiAgICBYID0gdmFsdWVzLm1hcCh1dGlsLiQoYSkpO1xuICAgIE4gPSBiO1xuICAgIGFscGhhID0gYztcbiAgICBzbW9vdGggPSBkO1xuICB9IGVsc2Uge1xuICAgIFggPSB2YWx1ZXM7XG4gICAgTiA9IGE7XG4gICAgYWxwaGEgPSBiO1xuICAgIHNtb290aCA9IGM7XG4gIH1cbiAgTiA9IE4gPyArTiA6IDEwMDA7XG4gIGFscGhhID0gYWxwaGEgfHwgMC4wNTtcblxuICBicyA9IGdlbi5yYW5kb20uYm9vdHN0cmFwKFgsIHNtb290aCk7XG4gIGZvciAoaT0wLCBtZWFucyA9IEFycmF5KE4pOyBpPE47ICsraSkge1xuICAgIG1lYW5zW2ldID0gc3RhdHMubWVhbihicy5zYW1wbGVzKFgubGVuZ3RoKSk7XG4gIH1cbiAgbWVhbnMuc29ydCh1dGlsLm51bWNtcCk7XG4gIHJldHVybiBbXG4gICAgc3RhdHMucXVhbnRpbGUobWVhbnMsIGFscGhhLzIpLFxuICAgIHN0YXRzLnF1YW50aWxlKG1lYW5zLCAxLShhbHBoYS8yKSlcbiAgXTtcbn07XG5cbi8vIE5hbWVzcGFjZSBmb3Igei10ZXN0c1xuc3RhdHMueiA9IHt9O1xuXG4vLyBDb25zdHJ1Y3QgYSB6LWNvbmZpZGVuY2UgaW50ZXJ2YWwgYXQgYSBnaXZlbiBzaWduaWZpY2FuY2UgbGV2ZWxcbi8vIEFyZ3VtZW50cyBhcmUgYW4gYXJyYXkgYW5kIGFuIG9wdGlvbmFsIGFscGhhIChkZWZhdWx0cyB0byAwLjA1KS5cbnN0YXRzLnouY2kgPSBmdW5jdGlvbih2YWx1ZXMsIGEsIGIpIHtcbiAgdmFyIFggPSB2YWx1ZXMsIGFscGhhID0gYTtcbiAgaWYgKHV0aWwuaXNGdW5jdGlvbihhKSB8fCB1dGlsLmlzU3RyaW5nKGEpKSB7XG4gICAgWCA9IHZhbHVlcy5tYXAodXRpbC4kKGEpKTtcbiAgICBhbHBoYSA9IGI7XG4gIH1cbiAgYWxwaGEgPSBhbHBoYSB8fCAwLjA1O1xuXG4gIHZhciB6ID0gYWxwaGE9PT0wLjA1ID8gMS45NiA6IGdlbi5yYW5kb20ubm9ybWFsKDAsIDEpLmljZGYoMS0oYWxwaGEvMikpLFxuICAgICAgbXUgPSBzdGF0cy5tZWFuKFgpLFxuICAgICAgU0UgPSBzdGF0cy5zdGRldihYKSAvIE1hdGguc3FydChzdGF0cy5jb3VudC52YWxpZChYKSk7XG4gIHJldHVybiBbbXUgLSAoeipTRSksIG11ICsgKHoqU0UpXTtcbn07XG5cbi8vIFBlcmZvcm0gYSB6LXRlc3Qgb2YgbWVhbnMuIFJldHVybnMgdGhlIHAtdmFsdWUuXG4vLyBJZiBhIHNpbmdsZSBhcnJheSBpcyBwcm92aWRlZCwgcGVyZm9ybXMgYSBvbmUtc2FtcGxlIGxvY2F0aW9uIHRlc3QuXG4vLyBJZiB0d28gYXJyYXlzIG9yIGEgdGFibGUgYW5kIHR3byBhY2Nlc3NvcnMgYXJlIHByb3ZpZGVkLCBwZXJmb3Jtc1xuLy8gYSB0d28tc2FtcGxlIGxvY2F0aW9uIHRlc3QuIEEgcGFpcmVkIHRlc3QgaXMgcGVyZm9ybWVkIGlmIHNwZWNpZmllZFxuLy8gYnkgdGhlIG9wdGlvbnMgaGFzaC5cbi8vIFRoZSBvcHRpb25zIGhhc2ggZm9ybWF0IGlzOiB7cGFpcmVkOiBib29sZWFuLCBudWxsaDogbnVtYmVyfS5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvWi10ZXN0XG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1BhaXJlZF9kaWZmZXJlbmNlX3Rlc3RcbnN0YXRzLnoudGVzdCA9IGZ1bmN0aW9uKHZhbHVlcywgYSwgYiwgb3B0KSB7XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24oYikgfHwgdXRpbC5pc1N0cmluZyhiKSkgeyAvLyB0YWJsZSBhbmQgYWNjZXNzb3JzXG4gICAgcmV0dXJuIChvcHQgJiYgb3B0LnBhaXJlZCA/IHp0ZXN0UCA6IHp0ZXN0Mikob3B0LCB2YWx1ZXMsIGEsIGIpO1xuICB9IGVsc2UgaWYgKHV0aWwuaXNBcnJheShhKSkgeyAvLyB0d28gYXJyYXlzXG4gICAgcmV0dXJuIChiICYmIGIucGFpcmVkID8genRlc3RQIDogenRlc3QyKShiLCB2YWx1ZXMsIGEpO1xuICB9IGVsc2UgaWYgKHV0aWwuaXNGdW5jdGlvbihhKSB8fCB1dGlsLmlzU3RyaW5nKGEpKSB7XG4gICAgcmV0dXJuIHp0ZXN0MShiLCB2YWx1ZXMsIGEpOyAvLyB0YWJsZSBhbmQgYWNjZXNzb3JcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4genRlc3QxKGEsIHZhbHVlcyk7IC8vIG9uZSBhcnJheVxuICB9XG59O1xuXG4vLyBQZXJmb3JtIGEgei10ZXN0IG9mIG1lYW5zLiBSZXR1cm5zIHRoZSBwLXZhbHVlLlxuLy8gQXNzdW1pbmcgd2UgaGF2ZSBhIGxpc3Qgb2YgdmFsdWVzLCBhbmQgYSBudWxsIGh5cG90aGVzaXMuIElmIG5vIG51bGxcbi8vIGh5cG90aGVzaXMsIGFzc3VtZSBvdXIgbnVsbCBoeXBvdGhlc2lzIGlzIG11PTAuXG5mdW5jdGlvbiB6dGVzdDEob3B0LCBYLCBmKSB7XG4gIHZhciBudWxsSCA9IG9wdCAmJiBvcHQubnVsbGggfHwgMCxcbiAgICAgIGdhdXNzaWFuID0gZ2VuLnJhbmRvbS5ub3JtYWwoMCwgMSksXG4gICAgICBtdSA9IHN0YXRzLm1lYW4oWCxmKSxcbiAgICAgIFNFID0gc3RhdHMuc3RkZXYoWCxmKSAvIE1hdGguc3FydChzdGF0cy5jb3VudC52YWxpZChYLGYpKTtcblxuICBpZiAoU0U9PT0wKSB7XG4gICAgLy8gVGVzdCBub3Qgd2VsbCBkZWZpbmVkIHdoZW4gc3RhbmRhcmQgZXJyb3IgaXMgMC5cbiAgICByZXR1cm4gKG11IC0gbnVsbEgpID09PSAwID8gMSA6IDA7XG4gIH1cbiAgLy8gVHdvLXNpZGVkLCBzbyB0d2ljZSB0aGUgb25lLXNpZGVkIGNkZi5cbiAgdmFyIHogPSAobXUgLSBudWxsSCkgLyBTRTtcbiAgcmV0dXJuIDIgKiBnYXVzc2lhbi5jZGYoLU1hdGguYWJzKHopKTtcbn1cblxuLy8gUGVyZm9ybSBhIHR3byBzYW1wbGUgcGFpcmVkIHotdGVzdCBvZiBtZWFucy4gUmV0dXJucyB0aGUgcC12YWx1ZS5cbmZ1bmN0aW9uIHp0ZXN0UChvcHQsIHZhbHVlcywgYSwgYikge1xuICB2YXIgWCA9IGIgPyB2YWx1ZXMubWFwKHV0aWwuJChhKSkgOiB2YWx1ZXMsXG4gICAgICBZID0gYiA/IHZhbHVlcy5tYXAodXRpbC4kKGIpKSA6IGEsXG4gICAgICBuMSA9IHN0YXRzLmNvdW50KFgpLFxuICAgICAgbjIgPSBzdGF0cy5jb3VudChZKSxcbiAgICAgIGRpZmZzID0gQXJyYXkoKSwgaTtcblxuICBpZiAobjEgIT09IG4yKSB7XG4gICAgdGhyb3cgRXJyb3IoJ0FycmF5IGxlbmd0aHMgbXVzdCBtYXRjaC4nKTtcbiAgfVxuICBmb3IgKGk9MDsgaTxuMTsgKytpKSB7XG4gICAgLy8gT25seSB2YWxpZCBkaWZmZXJlbmNlcyBzaG91bGQgY29udHJpYnV0ZSB0byB0aGUgdGVzdCBzdGF0aXN0aWNcbiAgICBpZiAodXRpbC5pc1ZhbGlkKFhbaV0pICYmIHV0aWwuaXNWYWxpZChZW2ldKSkge1xuICAgICAgZGlmZnMucHVzaChYW2ldIC0gWVtpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdGF0cy56LnRlc3QoZGlmZnMsIG9wdCAmJiBvcHQubnVsbGggfHwgMCk7XG59XG5cbi8vIFBlcmZvcm0gYSB0d28gc2FtcGxlIHotdGVzdCBvZiBtZWFucy4gUmV0dXJucyB0aGUgcC12YWx1ZS5cbmZ1bmN0aW9uIHp0ZXN0MihvcHQsIHZhbHVlcywgYSwgYikge1xuICB2YXIgWCA9IGIgPyB2YWx1ZXMubWFwKHV0aWwuJChhKSkgOiB2YWx1ZXMsXG4gICAgICBZID0gYiA/IHZhbHVlcy5tYXAodXRpbC4kKGIpKSA6IGEsXG4gICAgICBuMSA9IHN0YXRzLmNvdW50LnZhbGlkKFgpLFxuICAgICAgbjIgPSBzdGF0cy5jb3VudC52YWxpZChZKSxcbiAgICAgIGdhdXNzaWFuID0gZ2VuLnJhbmRvbS5ub3JtYWwoMCwgMSksXG4gICAgICBtZWFuRGlmZiA9IHN0YXRzLm1lYW4oWCkgLSBzdGF0cy5tZWFuKFkpIC0gKG9wdCAmJiBvcHQubnVsbGggfHwgMCksXG4gICAgICBTRSA9IE1hdGguc3FydChzdGF0cy52YXJpYW5jZShYKS9uMSArIHN0YXRzLnZhcmlhbmNlKFkpL24yKTtcblxuICBpZiAoU0U9PT0wKSB7XG4gICAgLy8gTm90IHdlbGwgZGVmaW5lZCB3aGVuIHBvb2xlZCBzdGFuZGFyZCBlcnJvciBpcyAwLlxuICAgIHJldHVybiBtZWFuRGlmZj09PTAgPyAxIDogMDtcbiAgfVxuICAvLyBUd28tdGFpbGVkLCBzbyB0d2ljZSB0aGUgb25lLXNpZGVkIGNkZi5cbiAgdmFyIHogPSBtZWFuRGlmZiAvIFNFO1xuICByZXR1cm4gMiAqIGdhdXNzaWFuLmNkZigtTWF0aC5hYnMoeikpO1xufVxuXG4vLyBDb25zdHJ1Y3QgYSBtZWFuLWNlbnRlcmVkIGRpc3RhbmNlIG1hdHJpeCBmb3IgYW4gYXJyYXkgb2YgbnVtYmVycy5cbnN0YXRzLmRpc3QubWF0ID0gZnVuY3Rpb24oWCkge1xuICB2YXIgbiA9IFgubGVuZ3RoLFxuICAgICAgbSA9IG4qbixcbiAgICAgIEEgPSBBcnJheShtKSxcbiAgICAgIFIgPSBnZW4uemVyb3MobiksXG4gICAgICBNID0gMCwgdiwgaSwgajtcblxuICBmb3IgKGk9MDsgaTxuOyArK2kpIHtcbiAgICBBW2kqbitpXSA9IDA7XG4gICAgZm9yIChqPWkrMTsgajxuOyArK2opIHtcbiAgICAgIEFbaSpuK2pdID0gKHYgPSBNYXRoLmFicyhYW2ldIC0gWFtqXSkpO1xuICAgICAgQVtqKm4raV0gPSB2O1xuICAgICAgUltpXSArPSB2O1xuICAgICAgUltqXSArPSB2O1xuICAgIH1cbiAgfVxuXG4gIGZvciAoaT0wOyBpPG47ICsraSkge1xuICAgIE0gKz0gUltpXTtcbiAgICBSW2ldIC89IG47XG4gIH1cbiAgTSAvPSBtO1xuXG4gIGZvciAoaT0wOyBpPG47ICsraSkge1xuICAgIGZvciAoaj1pOyBqPG47ICsraikge1xuICAgICAgQVtpKm4ral0gKz0gTSAtIFJbaV0gLSBSW2pdO1xuICAgICAgQVtqKm4raV0gPSBBW2kqbitqXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gQTtcbn07XG5cbi8vIENvbXB1dGUgdGhlIFNoYW5ub24gZW50cm9weSAobG9nIGJhc2UgMikgb2YgYW4gYXJyYXkgb2YgY291bnRzLlxuc3RhdHMuZW50cm9weSA9IGZ1bmN0aW9uKGNvdW50cywgZikge1xuICBmID0gdXRpbC4kKGYpO1xuICB2YXIgaSwgcCwgcyA9IDAsIEggPSAwLCBuID0gY291bnRzLmxlbmd0aDtcbiAgZm9yIChpPTA7IGk8bjsgKytpKSB7XG4gICAgcyArPSAoZiA/IGYoY291bnRzW2ldKSA6IGNvdW50c1tpXSk7XG4gIH1cbiAgaWYgKHMgPT09IDApIHJldHVybiAwO1xuICBmb3IgKGk9MDsgaTxuOyArK2kpIHtcbiAgICBwID0gKGYgPyBmKGNvdW50c1tpXSkgOiBjb3VudHNbaV0pIC8gcztcbiAgICBpZiAocCkgSCArPSBwICogTWF0aC5sb2cocCk7XG4gIH1cbiAgcmV0dXJuIC1IIC8gTWF0aC5MTjI7XG59O1xuXG4vLyBDb21wdXRlIHRoZSBtdXR1YWwgaW5mb3JtYXRpb24gYmV0d2VlbiB0d28gZGlzY3JldGUgdmFyaWFibGVzLlxuLy8gUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgZm9ybSBbTUksIE1JX2Rpc3RhbmNlXVxuLy8gTUlfZGlzdGFuY2UgaXMgZGVmaW5lZCBhcyAxIC0gSShhLGIpIC8gSChhLGIpLlxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NdXR1YWxfaW5mb3JtYXRpb25cbnN0YXRzLm11dHVhbCA9IGZ1bmN0aW9uKHZhbHVlcywgYSwgYiwgY291bnRzKSB7XG4gIHZhciB4ID0gY291bnRzID8gdmFsdWVzLm1hcCh1dGlsLiQoYSkpIDogdmFsdWVzLFxuICAgICAgeSA9IGNvdW50cyA/IHZhbHVlcy5tYXAodXRpbC4kKGIpKSA6IGEsXG4gICAgICB6ID0gY291bnRzID8gdmFsdWVzLm1hcCh1dGlsLiQoY291bnRzKSkgOiBiO1xuXG4gIHZhciBweCA9IHt9LFxuICAgICAgcHkgPSB7fSxcbiAgICAgIG4gPSB6Lmxlbmd0aCxcbiAgICAgIHMgPSAwLCBJID0gMCwgSCA9IDAsIHAsIHQsIGk7XG5cbiAgZm9yIChpPTA7IGk8bjsgKytpKSB7XG4gICAgcHhbeFtpXV0gPSAwO1xuICAgIHB5W3lbaV1dID0gMDtcbiAgfVxuXG4gIGZvciAoaT0wOyBpPG47ICsraSkge1xuICAgIHB4W3hbaV1dICs9IHpbaV07XG4gICAgcHlbeVtpXV0gKz0geltpXTtcbiAgICBzICs9IHpbaV07XG4gIH1cblxuICB0ID0gMSAvIChzICogTWF0aC5MTjIpO1xuICBmb3IgKGk9MDsgaTxuOyArK2kpIHtcbiAgICBpZiAoeltpXSA9PT0gMCkgY29udGludWU7XG4gICAgcCA9IChzICogeltpXSkgLyAocHhbeFtpXV0gKiBweVt5W2ldXSk7XG4gICAgSSArPSB6W2ldICogdCAqIE1hdGgubG9nKHApO1xuICAgIEggKz0geltpXSAqIHQgKiBNYXRoLmxvZyh6W2ldL3MpO1xuICB9XG5cbiAgcmV0dXJuIFtJLCAxICsgSS9IXTtcbn07XG5cbi8vIENvbXB1dGUgdGhlIG11dHVhbCBpbmZvcm1hdGlvbiBiZXR3ZWVuIHR3byBkaXNjcmV0ZSB2YXJpYWJsZXMuXG5zdGF0cy5tdXR1YWwuaW5mbyA9IGZ1bmN0aW9uKHZhbHVlcywgYSwgYiwgY291bnRzKSB7XG4gIHJldHVybiBzdGF0cy5tdXR1YWwodmFsdWVzLCBhLCBiLCBjb3VudHMpWzBdO1xufTtcblxuLy8gQ29tcHV0ZSB0aGUgbXV0dWFsIGluZm9ybWF0aW9uIGRpc3RhbmNlIGJldHdlZW4gdHdvIGRpc2NyZXRlIHZhcmlhYmxlcy5cbi8vIE1JX2Rpc3RhbmNlIGlzIGRlZmluZWQgYXMgMSAtIEkoYSxiKSAvIEgoYSxiKS5cbnN0YXRzLm11dHVhbC5kaXN0ID0gZnVuY3Rpb24odmFsdWVzLCBhLCBiLCBjb3VudHMpIHtcbiAgcmV0dXJuIHN0YXRzLm11dHVhbCh2YWx1ZXMsIGEsIGIsIGNvdW50cylbMV07XG59O1xuXG4vLyBDb21wdXRlIGEgcHJvZmlsZSBvZiBzdW1tYXJ5IHN0YXRpc3RpY3MgZm9yIGEgdmFyaWFibGUuXG5zdGF0cy5wcm9maWxlID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIHZhciBtZWFuID0gMCxcbiAgICAgIHZhbGlkID0gMCxcbiAgICAgIG1pc3NpbmcgPSAwLFxuICAgICAgZGlzdGluY3QgPSAwLFxuICAgICAgbWluID0gbnVsbCxcbiAgICAgIG1heCA9IG51bGwsXG4gICAgICBNMiA9IDAsXG4gICAgICB2YWxzID0gW10sXG4gICAgICB1ID0ge30sIGRlbHRhLCBzZCwgaSwgdiwgeDtcblxuICAvLyBjb21wdXRlIHN1bW1hcnkgc3RhdHNcbiAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG5cbiAgICAvLyB1cGRhdGUgdW5pcXVlIHZhbHVlc1xuICAgIHVbdl0gPSAodiBpbiB1KSA/IHVbdl0gKyAxIDogKGRpc3RpbmN0ICs9IDEsIDEpO1xuXG4gICAgaWYgKHYgPT0gbnVsbCkge1xuICAgICAgKyttaXNzaW5nO1xuICAgIH0gZWxzZSBpZiAodXRpbC5pc1ZhbGlkKHYpKSB7XG4gICAgICAvLyB1cGRhdGUgc3RhdHNcbiAgICAgIHggPSAodHlwZW9mIHYgPT09ICdzdHJpbmcnKSA/IHYubGVuZ3RoIDogdjtcbiAgICAgIGlmIChtaW49PT1udWxsIHx8IHggPCBtaW4pIG1pbiA9IHg7XG4gICAgICBpZiAobWF4PT09bnVsbCB8fCB4ID4gbWF4KSBtYXggPSB4O1xuICAgICAgZGVsdGEgPSB4IC0gbWVhbjtcbiAgICAgIG1lYW4gPSBtZWFuICsgZGVsdGEgLyAoKyt2YWxpZCk7XG4gICAgICBNMiA9IE0yICsgZGVsdGEgKiAoeCAtIG1lYW4pO1xuICAgICAgdmFscy5wdXNoKHgpO1xuICAgIH1cbiAgfVxuICBNMiA9IE0yIC8gKHZhbGlkIC0gMSk7XG4gIHNkID0gTWF0aC5zcXJ0KE0yKTtcblxuICAvLyBzb3J0IHZhbHVlcyBmb3IgbWVkaWFuIGFuZCBpcXJcbiAgdmFscy5zb3J0KHV0aWwuY21wKTtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICAgICB0eXBlKHZhbHVlcywgZiksXG4gICAgdW5pcXVlOiAgIHUsXG4gICAgY291bnQ6ICAgIHZhbHVlcy5sZW5ndGgsXG4gICAgdmFsaWQ6ICAgIHZhbGlkLFxuICAgIG1pc3Npbmc6ICBtaXNzaW5nLFxuICAgIGRpc3RpbmN0OiBkaXN0aW5jdCxcbiAgICBtaW46ICAgICAgbWluLFxuICAgIG1heDogICAgICBtYXgsXG4gICAgbWVhbjogICAgIG1lYW4sXG4gICAgc3RkZXY6ICAgIHNkLFxuICAgIG1lZGlhbjogICAodiA9IHN0YXRzLnF1YW50aWxlKHZhbHMsIDAuNSkpLFxuICAgIHExOiAgICAgICBzdGF0cy5xdWFudGlsZSh2YWxzLCAwLjI1KSxcbiAgICBxMzogICAgICAgc3RhdHMucXVhbnRpbGUodmFscywgMC43NSksXG4gICAgbW9kZXNrZXc6IHNkID09PSAwID8gMCA6IChtZWFuIC0gdikgLyBzZFxuICB9O1xufTtcblxuLy8gQ29tcHV0ZSBwcm9maWxlcyBmb3IgYWxsIHZhcmlhYmxlcyBpbiBhIGRhdGEgc2V0Llxuc3RhdHMuc3VtbWFyeSA9IGZ1bmN0aW9uKGRhdGEsIGZpZWxkcykge1xuICBmaWVsZHMgPSBmaWVsZHMgfHwgdXRpbC5rZXlzKGRhdGFbMF0pO1xuICB2YXIgcyA9IGZpZWxkcy5tYXAoZnVuY3Rpb24oZikge1xuICAgIHZhciBwID0gc3RhdHMucHJvZmlsZShkYXRhLCB1dGlsLiQoZikpO1xuICAgIHJldHVybiAocC5maWVsZCA9IGYsIHApO1xuICB9KTtcbiAgcmV0dXJuIChzLl9fc3VtbWFyeV9fID0gdHJ1ZSwgcyk7XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKSxcbiAgICBmb3JtYXQgPSByZXF1aXJlKCcuL2Zvcm1hdCcpO1xuXG52YXIgY29udGV4dCA9IHtcbiAgZm9ybWF0czogICAgW10sXG4gIGZvcm1hdF9tYXA6IHt9LFxuICB0cnVuY2F0ZTogICB1dGlsLnRydW5jYXRlLFxuICBwYWQ6ICAgICAgICB1dGlsLnBhZCxcbiAgZGF5OiAgICAgICAgZm9ybWF0LmRheSxcbiAgbW9udGg6ICAgICAgZm9ybWF0Lm1vbnRoXG59O1xuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZXh0KSB7XG4gIHZhciBzcmMgPSBzb3VyY2UodGV4dCwgJ2QnKTtcbiAgc3JjID0gJ3ZhciBfX3Q7IHJldHVybiAnICsgc3JjICsgJzsnO1xuXG4gIC8qIGpzaGludCBldmlsOiB0cnVlICovXG4gIHJldHVybiAobmV3IEZ1bmN0aW9uKCdkJywgc3JjKSkuYmluZChjb250ZXh0KTtcbn1cblxudGVtcGxhdGUuc291cmNlID0gc291cmNlO1xudGVtcGxhdGUuY29udGV4dCA9IGNvbnRleHQ7XG50ZW1wbGF0ZS5mb3JtYXQgPSBnZXRfZm9ybWF0O1xubW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTtcblxuLy8gQ2xlYXIgY2FjaGUgb2YgZm9ybWF0IG9iamVjdHMuXG4vLyBUaGlzIGNhbiAqYnJlYWsqIHByaW9yIHRlbXBsYXRlIGZ1bmN0aW9ucywgc28gaW52b2tlIHdpdGggY2FyZSFcbnRlbXBsYXRlLmNsZWFyRm9ybWF0Q2FjaGUgPSBmdW5jdGlvbigpIHtcbiAgY29udGV4dC5mb3JtYXRzID0gW107XG4gIGNvbnRleHQuZm9ybWF0X21hcCA9IHt9O1xufTtcblxuLy8gR2VuZXJhdGUgcHJvcGVydHkgYWNjZXNzIGNvZGUgZm9yIHVzZSB3aXRoaW4gdGVtcGxhdGUgc291cmNlLlxuLy8gb2JqZWN0OiB0aGUgbmFtZSBvZiB0aGUgb2JqZWN0ICh2YXJpYWJsZSkgY29udGFpbmluZyB0ZW1wbGF0ZSBkYXRhXG4vLyBwcm9wZXJ0eTogdGhlIHByb3BlcnR5IGFjY2VzcyBzdHJpbmcsIHZlcmJhdGltIGZyb20gdGVtcGxhdGUgdGFnXG50ZW1wbGF0ZS5wcm9wZXJ0eSA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgdmFyIHNyYyA9IHV0aWwuZmllbGQocHJvcGVydHkpLm1hcCh1dGlsLnN0cikuam9pbignXVsnKTtcbiAgcmV0dXJuIG9iamVjdCArICdbJyArIHNyYyArICddJztcbn07XG5cbi8vIEdlbmVyYXRlIHNvdXJjZSBjb2RlIGZvciBhIHRlbXBsYXRlIGZ1bmN0aW9uLlxuLy8gdGV4dDogdGhlIHRlbXBsYXRlIHRleHRcbi8vIHZhcmlhYmxlOiB0aGUgbmFtZSBvZiB0aGUgZGF0YSBvYmplY3QgdmFyaWFibGUgKCdvYmonIGJ5IGRlZmF1bHQpXG4vLyBwcm9wZXJ0aWVzOiBvcHRpb25hbCBoYXNoIGZvciBjb2xsZWN0aW5nIGFsbCBhY2Nlc3NlZCBwcm9wZXJ0aWVzXG5mdW5jdGlvbiBzb3VyY2UodGV4dCwgdmFyaWFibGUsIHByb3BlcnRpZXMpIHtcbiAgdmFyaWFibGUgPSB2YXJpYWJsZSB8fCAnb2JqJztcbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIHNyYyA9ICdcXCcnO1xuICB2YXIgcmVnZXggPSB0ZW1wbGF0ZV9yZTtcblxuICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICB0ZXh0LnJlcGxhY2UocmVnZXgsIGZ1bmN0aW9uKG1hdGNoLCBpbnRlcnBvbGF0ZSwgb2Zmc2V0KSB7XG4gICAgc3JjICs9IHRleHRcbiAgICAgIC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgLnJlcGxhY2UodGVtcGxhdGVfZXNjYXBlciwgdGVtcGxhdGVfZXNjYXBlQ2hhcik7XG4gICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cbiAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgIHNyYyArPSAnXFwnXFxuKygoX190PSgnICtcbiAgICAgICAgdGVtcGxhdGVfdmFyKGludGVycG9sYXRlLCB2YXJpYWJsZSwgcHJvcGVydGllcykgK1xuICAgICAgICAnKSk9PW51bGw/XFwnXFwnOl9fdCkrXFxuXFwnJztcbiAgICB9XG5cbiAgICAvLyBBZG9iZSBWTXMgbmVlZCB0aGUgbWF0Y2ggcmV0dXJuZWQgdG8gcHJvZHVjZSB0aGUgY29ycmVjdCBvZmZlc3QuXG4gICAgcmV0dXJuIG1hdGNoO1xuICB9KTtcbiAgcmV0dXJuIHNyYyArICdcXCcnO1xufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZV92YXIodGV4dCwgdmFyaWFibGUsIHByb3BlcnRpZXMpIHtcbiAgdmFyIGZpbHRlcnMgPSB0ZXh0Lm1hdGNoKGZpbHRlcl9yZSk7XG4gIHZhciBwcm9wID0gZmlsdGVycy5zaGlmdCgpLnRyaW0oKTtcbiAgdmFyIHN0cmluZ0Nhc3QgPSB0cnVlO1xuXG4gIGZ1bmN0aW9uIHN0cmNhbGwoZm4pIHtcbiAgICBmbiA9IGZuIHx8ICcnO1xuICAgIGlmIChzdHJpbmdDYXN0KSB7XG4gICAgICBzdHJpbmdDYXN0ID0gZmFsc2U7XG4gICAgICBzcmMgPSAnU3RyaW5nKCcgKyBzcmMgKyAnKScgKyBmbjtcbiAgICB9IGVsc2Uge1xuICAgICAgc3JjICs9IGZuO1xuICAgIH1cbiAgICByZXR1cm4gc3JjO1xuICB9XG5cbiAgZnVuY3Rpb24gZGF0ZSgpIHtcbiAgICByZXR1cm4gJyh0eXBlb2YgJyArIHNyYyArICc9PT1cIm51bWJlclwiP25ldyBEYXRlKCcrc3JjKycpOicrc3JjKycpJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdHRlcih0eXBlKSB7XG4gICAgdmFyIHBhdHRlcm4gPSBhcmdzWzBdO1xuICAgIGlmICgocGF0dGVyblswXSA9PT0gJ1xcJycgJiYgcGF0dGVybltwYXR0ZXJuLmxlbmd0aC0xXSA9PT0gJ1xcJycpIHx8XG4gICAgICAgIChwYXR0ZXJuWzBdID09PSAnXCInICAmJiBwYXR0ZXJuW3BhdHRlcm4ubGVuZ3RoLTFdID09PSAnXCInKSkge1xuICAgICAgcGF0dGVybiA9IHBhdHRlcm4uc2xpY2UoMSwgLTEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBFcnJvcignRm9ybWF0IHBhdHRlcm4gbXVzdCBiZSBxdW90ZWQ6ICcgKyBwYXR0ZXJuKTtcbiAgICB9XG4gICAgYSA9IHRlbXBsYXRlX2Zvcm1hdChwYXR0ZXJuLCB0eXBlKTtcbiAgICBzdHJpbmdDYXN0ID0gZmFsc2U7XG4gICAgdmFyIGFyZyA9IHR5cGUgPT09ICdudW1iZXInID8gc3JjIDogZGF0ZSgpO1xuICAgIHNyYyA9ICd0aGlzLmZvcm1hdHNbJythKyddKCcrYXJnKycpJztcbiAgfVxuXG4gIGlmIChwcm9wZXJ0aWVzKSBwcm9wZXJ0aWVzW3Byb3BdID0gMTtcbiAgdmFyIHNyYyA9IHRlbXBsYXRlLnByb3BlcnR5KHZhcmlhYmxlLCBwcm9wKTtcblxuICBmb3IgKHZhciBpPTA7IGk8ZmlsdGVycy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBmID0gZmlsdGVyc1tpXSwgYXJncyA9IG51bGwsIHBpZHgsIGEsIGI7XG5cbiAgICBpZiAoKHBpZHg9Zi5pbmRleE9mKCc6JykpID4gMCkge1xuICAgICAgZiA9IGYuc2xpY2UoMCwgcGlkeCk7XG4gICAgICBhcmdzID0gZmlsdGVyc1tpXS5zbGljZShwaWR4KzEpXG4gICAgICAgIC5tYXRjaChhcmdzX3JlKVxuICAgICAgICAubWFwKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMudHJpbSgpOyB9KTtcbiAgICB9XG4gICAgZiA9IGYudHJpbSgpO1xuXG4gICAgc3dpdGNoIChmKSB7XG4gICAgICBjYXNlICdsZW5ndGgnOlxuICAgICAgICBzdHJjYWxsKCcubGVuZ3RoJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbG93ZXInOlxuICAgICAgICBzdHJjYWxsKCcudG9Mb3dlckNhc2UoKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3VwcGVyJzpcbiAgICAgICAgc3RyY2FsbCgnLnRvVXBwZXJDYXNlKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsb3dlci1sb2NhbGUnOlxuICAgICAgICBzdHJjYWxsKCcudG9Mb2NhbGVMb3dlckNhc2UoKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3VwcGVyLWxvY2FsZSc6XG4gICAgICAgIHN0cmNhbGwoJy50b0xvY2FsZVVwcGVyQ2FzZSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndHJpbSc6XG4gICAgICAgIHN0cmNhbGwoJy50cmltKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgYSA9IHV0aWwubnVtYmVyKGFyZ3NbMF0pO1xuICAgICAgICBzdHJjYWxsKCcuc2xpY2UoMCwnICsgYSArICcpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIHN0cmNhbGwoJy5zbGljZSgtJyArIGEgKycpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbWlkJzpcbiAgICAgICAgYSA9IHV0aWwubnVtYmVyKGFyZ3NbMF0pO1xuICAgICAgICBiID0gYSArIHV0aWwubnVtYmVyKGFyZ3NbMV0pO1xuICAgICAgICBzdHJjYWxsKCcuc2xpY2UoKycrYSsnLCcrYisnKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NsaWNlJzpcbiAgICAgICAgYSA9IHV0aWwubnVtYmVyKGFyZ3NbMF0pO1xuICAgICAgICBzdHJjYWxsKCcuc2xpY2UoJysgYSArXG4gICAgICAgICAgKGFyZ3MubGVuZ3RoID4gMSA/ICcsJyArIHV0aWwubnVtYmVyKGFyZ3NbMV0pIDogJycpICtcbiAgICAgICAgICAnKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RydW5jYXRlJzpcbiAgICAgICAgYSA9IHV0aWwubnVtYmVyKGFyZ3NbMF0pO1xuICAgICAgICBiID0gYXJnc1sxXTtcbiAgICAgICAgYiA9IChiIT09J2xlZnQnICYmIGIhPT0nbWlkZGxlJyAmJiBiIT09J2NlbnRlcicpID8gJ3JpZ2h0JyA6IGI7XG4gICAgICAgIHNyYyA9ICd0aGlzLnRydW5jYXRlKCcgKyBzdHJjYWxsKCkgKyAnLCcgKyBhICsgJyxcXCcnICsgYiArICdcXCcpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwYWQnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIGIgPSBhcmdzWzFdO1xuICAgICAgICBiID0gKGIhPT0nbGVmdCcgJiYgYiE9PSdtaWRkbGUnICYmIGIhPT0nY2VudGVyJykgPyAncmlnaHQnIDogYjtcbiAgICAgICAgc3JjID0gJ3RoaXMucGFkKCcgKyBzdHJjYWxsKCkgKyAnLCcgKyBhICsgJyxcXCcnICsgYiArICdcXCcpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICBmb3JtYXR0ZXIoJ251bWJlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RpbWUnOlxuICAgICAgICBmb3JtYXR0ZXIoJ3RpbWUnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0aW1lLXV0Yyc6XG4gICAgICAgIGZvcm1hdHRlcigndXRjJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICBzcmMgPSAndGhpcy5tb250aCgnICsgc3JjICsgJyknO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vbnRoLWFiYnJldic6XG4gICAgICAgIHNyYyA9ICd0aGlzLm1vbnRoKCcgKyBzcmMgKyAnLHRydWUpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkYXknOlxuICAgICAgICBzcmMgPSAndGhpcy5kYXkoJyArIHNyYyArICcpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkYXktYWJicmV2JzpcbiAgICAgICAgc3JjID0gJ3RoaXMuZGF5KCcgKyBzcmMgKyAnLHRydWUpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBFcnJvcignVW5yZWNvZ25pemVkIHRlbXBsYXRlIGZpbHRlcjogJyArIGYpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzcmM7XG59XG5cbnZhciB0ZW1wbGF0ZV9yZSA9IC9cXHtcXHsoLis/KVxcfVxcfXwkL2csXG4gICAgZmlsdGVyX3JlID0gLyg/OlwiW15cIl0qXCJ8XFwnW15cXCddKlxcJ3xbXlxcfFwiXSt8W15cXHxcXCddKykrL2csXG4gICAgYXJnc19yZSA9IC8oPzpcIlteXCJdKlwifFxcJ1teXFwnXSpcXCd8W14sXCJdK3xbXixcXCddKykrL2c7XG5cbi8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4vLyBzdHJpbmcgbGl0ZXJhbC5cbnZhciB0ZW1wbGF0ZV9lc2NhcGVzID0ge1xuICAnXFwnJzogICAgICdcXCcnLFxuICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICdcXHInOiAgICAgJ3InLFxuICAnXFxuJzogICAgICduJyxcbiAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAnXFx1MjAyOSc6ICd1MjAyOSdcbn07XG5cbnZhciB0ZW1wbGF0ZV9lc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdTIwMjh8XFx1MjAyOS9nO1xuXG5mdW5jdGlvbiB0ZW1wbGF0ZV9lc2NhcGVDaGFyKG1hdGNoKSB7XG4gIHJldHVybiAnXFxcXCcgKyB0ZW1wbGF0ZV9lc2NhcGVzW21hdGNoXTtcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGVfZm9ybWF0KHBhdHRlcm4sIHR5cGUpIHtcbiAgdmFyIGtleSA9IHR5cGUgKyAnOicgKyBwYXR0ZXJuO1xuICBpZiAoY29udGV4dC5mb3JtYXRfbWFwW2tleV0gPT0gbnVsbCkge1xuICAgIHZhciBmID0gZm9ybWF0W3R5cGVdKHBhdHRlcm4pO1xuICAgIHZhciBpID0gY29udGV4dC5mb3JtYXRzLmxlbmd0aDtcbiAgICBjb250ZXh0LmZvcm1hdHMucHVzaChmKTtcbiAgICBjb250ZXh0LmZvcm1hdF9tYXBba2V5XSA9IGk7XG4gICAgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQuZm9ybWF0X21hcFtrZXldO1xufVxuXG5mdW5jdGlvbiBnZXRfZm9ybWF0KHBhdHRlcm4sIHR5cGUpIHtcbiAgcmV0dXJuIGNvbnRleHQuZm9ybWF0c1t0ZW1wbGF0ZV9mb3JtYXQocGF0dGVybiwgdHlwZSldO1xufVxuIiwidmFyIGQzX3RpbWUgPSByZXF1aXJlKCdkMy10aW1lJyk7XG5cbnZhciB0ZW1wRGF0ZSA9IG5ldyBEYXRlKCksXG4gICAgYmFzZURhdGUgPSBuZXcgRGF0ZSgwLCAwLCAxKS5zZXRGdWxsWWVhcigwKSwgLy8gSmFuIDEsIDAgQURcbiAgICB1dGNCYXNlRGF0ZSA9IG5ldyBEYXRlKERhdGUuVVRDKDAsIDAsIDEpKS5zZXRVVENGdWxsWWVhcigwKTtcblxuZnVuY3Rpb24gZGF0ZShkKSB7XG4gIHJldHVybiAodGVtcERhdGUuc2V0VGltZSgrZCksIHRlbXBEYXRlKTtcbn1cblxuLy8gY3JlYXRlIGEgdGltZSB1bml0IGVudHJ5XG5mdW5jdGlvbiBlbnRyeSh0eXBlLCBkYXRlLCB1bml0LCBzdGVwLCBtaW4sIG1heCkge1xuICB2YXIgZSA9IHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGRhdGU6IGRhdGUsXG4gICAgdW5pdDogdW5pdFxuICB9O1xuICBpZiAoc3RlcCkge1xuICAgIGUuc3RlcCA9IHN0ZXA7XG4gIH0gZWxzZSB7XG4gICAgZS5taW5zdGVwID0gMTtcbiAgfVxuICBpZiAobWluICE9IG51bGwpIGUubWluID0gbWluO1xuICBpZiAobWF4ICE9IG51bGwpIGUubWF4ID0gbWF4O1xuICByZXR1cm4gZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlKHR5cGUsIHVuaXQsIGJhc2UsIHN0ZXAsIG1pbiwgbWF4KSB7XG4gIHJldHVybiBlbnRyeSh0eXBlLFxuICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHVuaXQub2Zmc2V0KGJhc2UsIGQpOyB9LFxuICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHVuaXQuY291bnQoYmFzZSwgZCk7IH0sXG4gICAgc3RlcCwgbWluLCBtYXgpO1xufVxuXG52YXIgbG9jYWxlID0gW1xuICBjcmVhdGUoJ3NlY29uZCcsIGQzX3RpbWUuc2Vjb25kLCBiYXNlRGF0ZSksXG4gIGNyZWF0ZSgnbWludXRlJywgZDNfdGltZS5taW51dGUsIGJhc2VEYXRlKSxcbiAgY3JlYXRlKCdob3VyJywgICBkM190aW1lLmhvdXIsICAgYmFzZURhdGUpLFxuICBjcmVhdGUoJ2RheScsICAgIGQzX3RpbWUuZGF5LCAgICBiYXNlRGF0ZSwgWzEsIDddKSxcbiAgY3JlYXRlKCdtb250aCcsICBkM190aW1lLm1vbnRoLCAgYmFzZURhdGUsIFsxLCAzLCA2XSksXG4gIGNyZWF0ZSgneWVhcicsICAgZDNfdGltZS55ZWFyLCAgIGJhc2VEYXRlKSxcblxuICAvLyBwZXJpb2RpYyB1bml0c1xuICBlbnRyeSgnc2Vjb25kcycsXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gbmV3IERhdGUoMTk3MCwgMCwgMSwgMCwgMCwgZCk7IH0sXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZGF0ZShkKS5nZXRTZWNvbmRzKCk7IH0sXG4gICAgbnVsbCwgMCwgNTlcbiAgKSxcbiAgZW50cnkoJ21pbnV0ZXMnLFxuICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIG5ldyBEYXRlKDE5NzAsIDAsIDEsIDAsIGQpOyB9LFxuICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRhdGUoZCkuZ2V0TWludXRlcygpOyB9LFxuICAgIG51bGwsIDAsIDU5XG4gICksXG4gIGVudHJ5KCdob3VycycsXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gbmV3IERhdGUoMTk3MCwgMCwgMSwgZCk7IH0sXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZGF0ZShkKS5nZXRIb3VycygpOyB9LFxuICAgIG51bGwsIDAsIDIzXG4gICksXG4gIGVudHJ5KCd3ZWVrZGF5cycsXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gbmV3IERhdGUoMTk3MCwgMCwgNCtkKTsgfSxcbiAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkYXRlKGQpLmdldERheSgpOyB9LFxuICAgIFsxXSwgMCwgNlxuICApLFxuICBlbnRyeSgnZGF0ZXMnLFxuICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIG5ldyBEYXRlKDE5NzAsIDAsIGQpOyB9LFxuICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRhdGUoZCkuZ2V0RGF0ZSgpOyB9LFxuICAgIFsxXSwgMSwgMzFcbiAgKSxcbiAgZW50cnkoJ21vbnRocycsXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gbmV3IERhdGUoMTk3MCwgZCAlIDEyLCAxKTsgfSxcbiAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkYXRlKGQpLmdldE1vbnRoKCk7IH0sXG4gICAgWzFdLCAwLCAxMVxuICApXG5dO1xuXG52YXIgdXRjID0gW1xuICBjcmVhdGUoJ3NlY29uZCcsIGQzX3RpbWUudXRjU2Vjb25kLCB1dGNCYXNlRGF0ZSksXG4gIGNyZWF0ZSgnbWludXRlJywgZDNfdGltZS51dGNNaW51dGUsIHV0Y0Jhc2VEYXRlKSxcbiAgY3JlYXRlKCdob3VyJywgICBkM190aW1lLnV0Y0hvdXIsICAgdXRjQmFzZURhdGUpLFxuICBjcmVhdGUoJ2RheScsICAgIGQzX3RpbWUudXRjRGF5LCAgICB1dGNCYXNlRGF0ZSwgWzEsIDddKSxcbiAgY3JlYXRlKCdtb250aCcsICBkM190aW1lLnV0Y01vbnRoLCAgdXRjQmFzZURhdGUsIFsxLCAzLCA2XSksXG4gIGNyZWF0ZSgneWVhcicsICAgZDNfdGltZS51dGNZZWFyLCAgIHV0Y0Jhc2VEYXRlKSxcblxuICAvLyBwZXJpb2RpYyB1bml0c1xuICBlbnRyeSgnc2Vjb25kcycsXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoMTk3MCwgMCwgMSwgMCwgMCwgZCkpOyB9LFxuICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRhdGUoZCkuZ2V0VVRDU2Vjb25kcygpOyB9LFxuICAgIG51bGwsIDAsIDU5XG4gICksXG4gIGVudHJ5KCdtaW51dGVzJyxcbiAgICBmdW5jdGlvbihkKSB7IHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQygxOTcwLCAwLCAxLCAwLCBkKSk7IH0sXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZGF0ZShkKS5nZXRVVENNaW51dGVzKCk7IH0sXG4gICAgbnVsbCwgMCwgNTlcbiAgKSxcbiAgZW50cnkoJ2hvdXJzJyxcbiAgICBmdW5jdGlvbihkKSB7IHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQygxOTcwLCAwLCAxLCBkKSk7IH0sXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZGF0ZShkKS5nZXRVVENIb3VycygpOyB9LFxuICAgIG51bGwsIDAsIDIzXG4gICksXG4gIGVudHJ5KCd3ZWVrZGF5cycsXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoMTk3MCwgMCwgNCtkKSk7IH0sXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZGF0ZShkKS5nZXRVVENEYXkoKTsgfSxcbiAgICBbMV0sIDAsIDZcbiAgKSxcbiAgZW50cnkoJ2RhdGVzJyxcbiAgICBmdW5jdGlvbihkKSB7IHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQygxOTcwLCAwLCBkKSk7IH0sXG4gICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZGF0ZShkKS5nZXRVVENEYXRlKCk7IH0sXG4gICAgWzFdLCAxLCAzMVxuICApLFxuICBlbnRyeSgnbW9udGhzJyxcbiAgICBmdW5jdGlvbihkKSB7IHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQygxOTcwLCBkICUgMTIsIDEpKTsgfSxcbiAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkYXRlKGQpLmdldFVUQ01vbnRoKCk7IH0sXG4gICAgWzFdLCAwLCAxMVxuICApXG5dO1xuXG52YXIgU1RFUFMgPSBbXG4gIFszMTUzNmU2LCA1XSwgIC8vIDEteWVhclxuICBbNzc3NmU2LCA0XSwgICAvLyAzLW1vbnRoXG4gIFsyNTkyZTYsIDRdLCAgIC8vIDEtbW9udGhcbiAgWzEyMDk2ZTUsIDNdLCAgLy8gMi13ZWVrXG4gIFs2MDQ4ZTUsIDNdLCAgIC8vIDEtd2Vla1xuICBbMTcyOGU1LCAzXSwgICAvLyAyLWRheVxuICBbODY0ZTUsIDNdLCAgICAvLyAxLWRheVxuICBbNDMyZTUsIDJdLCAgICAvLyAxMi1ob3VyXG4gIFsyMTZlNSwgMl0sICAgIC8vIDYtaG91clxuICBbMTA4ZTUsIDJdLCAgICAvLyAzLWhvdXJcbiAgWzM2ZTUsIDJdLCAgICAgLy8gMS1ob3VyXG4gIFsxOGU1LCAxXSwgICAgIC8vIDMwLW1pbnV0ZVxuICBbOWU1LCAxXSwgICAgICAvLyAxNS1taW51dGVcbiAgWzNlNSwgMV0sICAgICAgLy8gNS1taW51dGVcbiAgWzZlNCwgMV0sICAgICAgLy8gMS1taW51dGVcbiAgWzNlNCwgMF0sICAgICAgLy8gMzAtc2Vjb25kXG4gIFsxNWUzLCAwXSwgICAgIC8vIDE1LXNlY29uZFxuICBbNWUzLCAwXSwgICAgICAvLyA1LXNlY29uZFxuICBbMWUzLCAwXSAgICAgICAvLyAxLXNlY29uZFxuXTtcblxuZnVuY3Rpb24gZmluZCh1bml0cywgc3BhbiwgbWluYiwgbWF4Yikge1xuICB2YXIgc3RlcCA9IFNURVBTWzBdLCBpLCBuLCBiaW5zO1xuXG4gIGZvciAoaT0xLCBuPVNURVBTLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICBzdGVwID0gU1RFUFNbaV07XG4gICAgaWYgKHNwYW4gPiBzdGVwWzBdKSB7XG4gICAgICBiaW5zID0gc3BhbiAvIHN0ZXBbMF07XG4gICAgICBpZiAoYmlucyA+IG1heGIpIHtcbiAgICAgICAgcmV0dXJuIHVuaXRzW1NURVBTW2ktMV1bMV1dO1xuICAgICAgfVxuICAgICAgaWYgKGJpbnMgPj0gbWluYikge1xuICAgICAgICByZXR1cm4gdW5pdHNbc3RlcFsxXV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bml0c1tTVEVQU1tuLTFdWzFdXTtcbn1cblxuZnVuY3Rpb24gdG9Vbml0TWFwKHVuaXRzKSB7XG4gIHZhciBtYXAgPSB7fSwgaSwgbjtcbiAgZm9yIChpPTAsIG49dW5pdHMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIG1hcFt1bml0c1tpXS50eXBlXSA9IHVuaXRzW2ldO1xuICB9XG4gIG1hcC5maW5kID0gZnVuY3Rpb24oc3BhbiwgbWluYiwgbWF4Yikge1xuICAgIHJldHVybiBmaW5kKHVuaXRzLCBzcGFuLCBtaW5iLCBtYXhiKTtcbiAgfTtcbiAgcmV0dXJuIG1hcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b1VuaXRNYXAobG9jYWxlKTtcbm1vZHVsZS5leHBvcnRzLnV0YyA9IHRvVW5pdE1hcCh1dGMpOyIsInZhciB1ID0gbW9kdWxlLmV4cG9ydHM7XG5cbi8vIHV0aWxpdHkgZnVuY3Rpb25zXG5cbnZhciBGTkFNRSA9ICdfX25hbWVfXyc7XG5cbnUubmFtZWRmdW5jID0gZnVuY3Rpb24obmFtZSwgZikgeyByZXR1cm4gKGZbRk5BTUVdID0gbmFtZSwgZik7IH07XG5cbnUubmFtZSA9IGZ1bmN0aW9uKGYpIHsgcmV0dXJuIGY9PW51bGwgPyBudWxsIDogZltGTkFNRV07IH07XG5cbnUuaWRlbnRpdHkgPSBmdW5jdGlvbih4KSB7IHJldHVybiB4OyB9O1xuXG51LnRydWUgPSB1Lm5hbWVkZnVuYygndHJ1ZScsIGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfSk7XG5cbnUuZmFsc2UgPSB1Lm5hbWVkZnVuYygnZmFsc2UnLCBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9KTtcblxudS5kdXBsaWNhdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqKSk7XG59O1xuXG51LmVxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYSkgPT09IEpTT04uc3RyaW5naWZ5KGIpO1xufTtcblxudS5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgZm9yICh2YXIgeCwgbmFtZSwgaT0xLCBsZW49YXJndW1lbnRzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIHggPSBhcmd1bWVudHNbaV07XG4gICAgZm9yIChuYW1lIGluIHgpIHsgb2JqW25hbWVdID0geFtuYW1lXTsgfVxuICB9XG4gIHJldHVybiBvYmo7XG59O1xuXG51Lmxlbmd0aCA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHggIT0gbnVsbCAmJiB4Lmxlbmd0aCAhPSBudWxsID8geC5sZW5ndGggOiBudWxsO1xufTtcblxudS5rZXlzID0gZnVuY3Rpb24oeCkge1xuICB2YXIga2V5cyA9IFtdLCBrO1xuICBmb3IgKGsgaW4geCkga2V5cy5wdXNoKGspO1xuICByZXR1cm4ga2V5cztcbn07XG5cbnUudmFscyA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIHZhbHMgPSBbXSwgaztcbiAgZm9yIChrIGluIHgpIHZhbHMucHVzaCh4W2tdKTtcbiAgcmV0dXJuIHZhbHM7XG59O1xuXG51LnRvTWFwID0gZnVuY3Rpb24obGlzdCwgZikge1xuICByZXR1cm4gKGYgPSB1LiQoZikpID9cbiAgICBsaXN0LnJlZHVjZShmdW5jdGlvbihvYmosIHgpIHsgcmV0dXJuIChvYmpbZih4KV0gPSAxLCBvYmopOyB9LCB7fSkgOlxuICAgIGxpc3QucmVkdWNlKGZ1bmN0aW9uKG9iaiwgeCkgeyByZXR1cm4gKG9ialt4XSA9IDEsIG9iaik7IH0sIHt9KTtcbn07XG5cbnUua2V5c3RyID0gZnVuY3Rpb24odmFsdWVzKSB7XG4gIC8vIHVzZSB0byBlbnN1cmUgY29uc2lzdGVudCBrZXkgZ2VuZXJhdGlvbiBhY3Jvc3MgbW9kdWxlc1xuICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gIGlmICghbikgcmV0dXJuICcnO1xuICBmb3IgKHZhciBzPVN0cmluZyh2YWx1ZXNbMF0pLCBpPTE7IGk8bjsgKytpKSB7XG4gICAgcyArPSAnfCcgKyBTdHJpbmcodmFsdWVzW2ldKTtcbiAgfVxuICByZXR1cm4gcztcbn07XG5cbi8vIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnUuaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG59O1xuXG51LmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn07XG5cbnUuaXNTdHJpbmcgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBTdHJpbmddJztcbn07XG5cbnUuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG51LmlzTnVtYmVyID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0eXBlb2Ygb2JqID09PSAnbnVtYmVyJyB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE51bWJlcl0nO1xufTtcblxudS5pc0Jvb2xlYW4gPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG59O1xuXG51LmlzRGF0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSc7XG59O1xuXG51LmlzVmFsaWQgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIG9iaiAhPSBudWxsICYmIG9iaiA9PT0gb2JqO1xufTtcblxudS5pc0J1ZmZlciA9ICh0eXBlb2YgQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIEJ1ZmZlci5pc0J1ZmZlcikgfHwgdS5mYWxzZTtcblxuLy8gdHlwZSBjb2VyY2lvbiBmdW5jdGlvbnNcblxudS5udW1iZXIgPSBmdW5jdGlvbihzKSB7XG4gIHJldHVybiBzID09IG51bGwgfHwgcyA9PT0gJycgPyBudWxsIDogK3M7XG59O1xuXG51LmJvb2xlYW4gPSBmdW5jdGlvbihzKSB7XG4gIHJldHVybiBzID09IG51bGwgfHwgcyA9PT0gJycgPyBudWxsIDogcz09PSdmYWxzZScgPyBmYWxzZSA6ICEhcztcbn07XG5cbi8vIHBhcnNlIGEgZGF0ZSB3aXRoIG9wdGlvbmFsIGQzLnRpbWUtZm9ybWF0IGZvcm1hdFxudS5kYXRlID0gZnVuY3Rpb24ocywgZm9ybWF0KSB7XG4gIHZhciBkID0gZm9ybWF0ID8gZm9ybWF0IDogRGF0ZTtcbiAgcmV0dXJuIHMgPT0gbnVsbCB8fCBzID09PSAnJyA/IG51bGwgOiBkLnBhcnNlKHMpO1xufTtcblxudS5hcnJheSA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHggIT0gbnVsbCA/ICh1LmlzQXJyYXkoeCkgPyB4IDogW3hdKSA6IFtdO1xufTtcblxudS5zdHIgPSBmdW5jdGlvbih4KSB7XG4gIHJldHVybiB1LmlzQXJyYXkoeCkgPyAnWycgKyB4Lm1hcCh1LnN0cikgKyAnXSdcbiAgICA6IHUuaXNPYmplY3QoeCkgfHwgdS5pc1N0cmluZyh4KSA/XG4gICAgICAvLyBPdXRwdXQgdmFsaWQgSlNPTiBhbmQgSlMgc291cmNlIHN0cmluZ3MuXG4gICAgICAvLyBTZWUgaHR0cDovL3RpbWVsZXNzcmVwby5jb20vanNvbi1pc250LWEtamF2YXNjcmlwdC1zdWJzZXRcbiAgICAgIEpTT04uc3RyaW5naWZ5KHgpLnJlcGxhY2UoJ1xcdTIwMjgnLCdcXFxcdTIwMjgnKS5yZXBsYWNlKCdcXHUyMDI5JywgJ1xcXFx1MjAyOScpXG4gICAgOiB4O1xufTtcblxuLy8gZGF0YSBhY2Nlc3MgZnVuY3Rpb25zXG5cbnZhciBmaWVsZF9yZSA9IC9cXFsoLio/KVxcXXxbXi5cXFtdKy9nO1xuXG51LmZpZWxkID0gZnVuY3Rpb24oZikge1xuICByZXR1cm4gU3RyaW5nKGYpLm1hdGNoKGZpZWxkX3JlKS5tYXAoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBkWzBdICE9PSAnWycgPyBkIDpcbiAgICAgIGRbMV0gIT09IFwiJ1wiICYmIGRbMV0gIT09ICdcIicgPyBkLnNsaWNlKDEsIC0xKSA6XG4gICAgICBkLnNsaWNlKDIsIC0yKS5yZXBsYWNlKC9cXFxcKFtcIiddKS9nLCAnJDEnKTtcbiAgfSk7XG59O1xuXG51LmFjY2Vzc29yID0gZnVuY3Rpb24oZikge1xuICAvKiBqc2hpbnQgZXZpbDogdHJ1ZSAqL1xuICByZXR1cm4gZj09bnVsbCB8fCB1LmlzRnVuY3Rpb24oZikgPyBmIDpcbiAgICB1Lm5hbWVkZnVuYyhmLCBGdW5jdGlvbigneCcsICdyZXR1cm4geFsnICsgdS5maWVsZChmKS5tYXAodS5zdHIpLmpvaW4oJ11bJykgKyAnXTsnKSk7XG59O1xuXG4vLyBzaG9ydC1jdXQgZm9yIGFjY2Vzc29yXG51LiQgPSB1LmFjY2Vzc29yO1xuXG51Lm11dGF0b3IgPSBmdW5jdGlvbihmKSB7XG4gIHZhciBzO1xuICByZXR1cm4gdS5pc1N0cmluZyhmKSAmJiAocz11LmZpZWxkKGYpKS5sZW5ndGggPiAxID9cbiAgICBmdW5jdGlvbih4LCB2KSB7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8cy5sZW5ndGgtMTsgKytpKSB4ID0geFtzW2ldXTtcbiAgICAgIHhbc1tpXV0gPSB2O1xuICAgIH0gOlxuICAgIGZ1bmN0aW9uKHgsIHYpIHsgeFtmXSA9IHY7IH07XG59O1xuXG5cbnUuJGZ1bmMgPSBmdW5jdGlvbihuYW1lLCBvcCkge1xuICByZXR1cm4gZnVuY3Rpb24oZikge1xuICAgIGYgPSB1LiQoZikgfHwgdS5pZGVudGl0eTtcbiAgICB2YXIgbiA9IG5hbWUgKyAodS5uYW1lKGYpID8gJ18nK3UubmFtZShmKSA6ICcnKTtcbiAgICByZXR1cm4gdS5uYW1lZGZ1bmMobiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gb3AoZihkKSk7IH0pO1xuICB9O1xufTtcblxudS4kdmFsaWQgID0gdS4kZnVuYygndmFsaWQnLCB1LmlzVmFsaWQpO1xudS4kbGVuZ3RoID0gdS4kZnVuYygnbGVuZ3RoJywgdS5sZW5ndGgpO1xuXG51LiRpbiA9IGZ1bmN0aW9uKGYsIHZhbHVlcykge1xuICBmID0gdS4kKGYpO1xuICB2YXIgbWFwID0gdS5pc0FycmF5KHZhbHVlcykgPyB1LnRvTWFwKHZhbHVlcykgOiB2YWx1ZXM7XG4gIHJldHVybiBmdW5jdGlvbihkKSB7IHJldHVybiAhIW1hcFtmKGQpXTsgfTtcbn07XG5cbi8vIGNvbXBhcmlzb24gLyBzb3J0aW5nIGZ1bmN0aW9uc1xuXG51LmNvbXBhcmF0b3IgPSBmdW5jdGlvbihzb3J0KSB7XG4gIHZhciBzaWduID0gW107XG4gIGlmIChzb3J0ID09PSB1bmRlZmluZWQpIHNvcnQgPSBbXTtcbiAgc29ydCA9IHUuYXJyYXkoc29ydCkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICB2YXIgcyA9IDE7XG4gICAgaWYgICAgICAoZlswXSA9PT0gJy0nKSB7IHMgPSAtMTsgZiA9IGYuc2xpY2UoMSk7IH1cbiAgICBlbHNlIGlmIChmWzBdID09PSAnKycpIHsgcyA9ICsxOyBmID0gZi5zbGljZSgxKTsgfVxuICAgIHNpZ24ucHVzaChzKTtcbiAgICByZXR1cm4gdS5hY2Nlc3NvcihmKTtcbiAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihhLGIpIHtcbiAgICB2YXIgaSwgbiwgZiwgeCwgeTtcbiAgICBmb3IgKGk9MCwgbj1zb3J0Lmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICAgIGYgPSBzb3J0W2ldOyB4ID0gZihhKTsgeSA9IGYoYik7XG4gICAgICBpZiAoeCA8IHkpIHJldHVybiAtMSAqIHNpZ25baV07XG4gICAgICBpZiAoeCA+IHkpIHJldHVybiBzaWduW2ldO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfTtcbn07XG5cbnUuY21wID0gZnVuY3Rpb24oYSwgYikge1xuICBpZiAoYSA8IGIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAoYSA+IGIpIHtcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIGlmIChhID49IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfSBlbHNlIGlmIChhID09PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKGIgPT09IG51bGwpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gTmFOO1xufTtcblxudS5udW1jbXAgPSBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYjsgfTtcblxudS5zdGFibGVzb3J0ID0gZnVuY3Rpb24oYXJyYXksIHNvcnRCeSwga2V5Rm4pIHtcbiAgdmFyIGluZGljZXMgPSBhcnJheS5yZWR1Y2UoZnVuY3Rpb24oaWR4LCB2LCBpKSB7XG4gICAgcmV0dXJuIChpZHhba2V5Rm4odildID0gaSwgaWR4KTtcbiAgfSwge30pO1xuXG4gIGFycmF5LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciBzYSA9IHNvcnRCeShhKSxcbiAgICAgICAgc2IgPSBzb3J0QnkoYik7XG4gICAgcmV0dXJuIHNhIDwgc2IgPyAtMSA6IHNhID4gc2IgPyAxXG4gICAgICAgICA6IChpbmRpY2VzW2tleUZuKGEpXSAtIGluZGljZXNba2V5Rm4oYildKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGFycmF5O1xufTtcblxuXG4vLyBzdHJpbmcgZnVuY3Rpb25zXG5cbnUucGFkID0gZnVuY3Rpb24ocywgbGVuZ3RoLCBwb3MsIHBhZGNoYXIpIHtcbiAgcGFkY2hhciA9IHBhZGNoYXIgfHwgXCIgXCI7XG4gIHZhciBkID0gbGVuZ3RoIC0gcy5sZW5ndGg7XG4gIGlmIChkIDw9IDApIHJldHVybiBzO1xuICBzd2l0Y2ggKHBvcykge1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgcmV0dXJuIHN0cnJlcChkLCBwYWRjaGFyKSArIHM7XG4gICAgY2FzZSAnbWlkZGxlJzpcbiAgICBjYXNlICdjZW50ZXInOlxuICAgICAgcmV0dXJuIHN0cnJlcChNYXRoLmZsb29yKGQvMiksIHBhZGNoYXIpICtcbiAgICAgICAgIHMgKyBzdHJyZXAoTWF0aC5jZWlsKGQvMiksIHBhZGNoYXIpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gcyArIHN0cnJlcChkLCBwYWRjaGFyKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gc3RycmVwKG4sIHN0cikge1xuICB2YXIgcyA9IFwiXCIsIGk7XG4gIGZvciAoaT0wOyBpPG47ICsraSkgcyArPSBzdHI7XG4gIHJldHVybiBzO1xufVxuXG51LnRydW5jYXRlID0gZnVuY3Rpb24ocywgbGVuZ3RoLCBwb3MsIHdvcmQsIGVsbGlwc2lzKSB7XG4gIHZhciBsZW4gPSBzLmxlbmd0aDtcbiAgaWYgKGxlbiA8PSBsZW5ndGgpIHJldHVybiBzO1xuICBlbGxpcHNpcyA9IGVsbGlwc2lzICE9PSB1bmRlZmluZWQgPyBTdHJpbmcoZWxsaXBzaXMpIDogJ1xcdTIwMjYnO1xuICB2YXIgbCA9IE1hdGgubWF4KDAsIGxlbmd0aCAtIGVsbGlwc2lzLmxlbmd0aCk7XG5cbiAgc3dpdGNoIChwb3MpIHtcbiAgICBjYXNlICdsZWZ0JzpcbiAgICAgIHJldHVybiBlbGxpcHNpcyArICh3b3JkID8gdHJ1bmNhdGVPbldvcmQocyxsLDEpIDogcy5zbGljZShsZW4tbCkpO1xuICAgIGNhc2UgJ21pZGRsZSc6XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHZhciBsMSA9IE1hdGguY2VpbChsLzIpLCBsMiA9IE1hdGguZmxvb3IobC8yKTtcbiAgICAgIHJldHVybiAod29yZCA/IHRydW5jYXRlT25Xb3JkKHMsbDEpIDogcy5zbGljZSgwLGwxKSkgK1xuICAgICAgICBlbGxpcHNpcyArICh3b3JkID8gdHJ1bmNhdGVPbldvcmQocyxsMiwxKSA6IHMuc2xpY2UobGVuLWwyKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAod29yZCA/IHRydW5jYXRlT25Xb3JkKHMsbCkgOiBzLnNsaWNlKDAsbCkpICsgZWxsaXBzaXM7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHRydW5jYXRlT25Xb3JkKHMsIGxlbiwgcmV2KSB7XG4gIHZhciBjbnQgPSAwLCB0b2sgPSBzLnNwbGl0KHRydW5jYXRlX3dvcmRfcmUpO1xuICBpZiAocmV2KSB7XG4gICAgcyA9ICh0b2sgPSB0b2sucmV2ZXJzZSgpKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbih3KSB7IGNudCArPSB3Lmxlbmd0aDsgcmV0dXJuIGNudCA8PSBsZW47IH0pXG4gICAgICAucmV2ZXJzZSgpO1xuICB9IGVsc2Uge1xuICAgIHMgPSB0b2suZmlsdGVyKGZ1bmN0aW9uKHcpIHsgY250ICs9IHcubGVuZ3RoOyByZXR1cm4gY250IDw9IGxlbjsgfSk7XG4gIH1cbiAgcmV0dXJuIHMubGVuZ3RoID8gcy5qb2luKCcnKS50cmltKCkgOiB0b2tbMF0uc2xpY2UoMCwgbGVuKTtcbn1cblxudmFyIHRydW5jYXRlX3dvcmRfcmUgPSAvKFtcXHUwMDA5XFx1MDAwQVxcdTAwMEJcXHUwMDBDXFx1MDAwRFxcdTAwMjBcXHUwMEEwXFx1MTY4MFxcdTE4MEVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwQVxcdTIwMkZcXHUyMDVGXFx1MjAyOFxcdTIwMjlcXHUzMDAwXFx1RkVGRl0pLztcbiJdfQ==
