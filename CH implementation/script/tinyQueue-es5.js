"use strict";

/*Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;*/

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*

  ISC License

  Copyright (c) 2017, Vladimir Agafonkin

  Permission to use, copy, modify, and/or distribute this software for any purpose
  with or without fee is hereby granted, provided that the above copyright notice
  and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
  OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
  TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
  THIS SOFTWARE.

*/
var TinyQueue =
/*#__PURE__*/
function () {
  function TinyQueue() {
    var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var compare = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultCompare;

    _classCallCheck(this, TinyQueue);

    this.data = data;
    this.length = this.data.length;
    this.compare = compare;

    if (this.length > 0) {
      for (var i = (this.length >> 1) - 1; i >= 0; i--) {
        this._down(i);
      }
    }
  }

  _createClass(TinyQueue, [{
    key: "push",
    value: function push(item) {
      this.data.push(item);
      this.length++;

      this._up(this.length - 1);
    }
  }, {
    key: "pop",
    value: function pop() {
      if (this.length === 0) return undefined;
      var top = this.data[0];
      var bottom = this.data.pop();
      this.length--;

      if (this.length > 0) {
        this.data[0] = bottom;

        this._down(0);
      }

      return top;
    }
  }, {
    key: "peek",
    value: function peek() {
      return this.data[0];
    }
  }, {
    key: "_up",
    value: function _up(pos) {
      var data = this.data,
          compare = this.compare;
      var item = data[pos];

      while (pos > 0) {
        var parent = pos - 1 >> 1;
        var current = data[parent];
        if (compare(item, current) >= 0) break;
        data[pos] = current;
        pos = parent;
      }

      data[pos] = item;
    }
  }, {
    key: "_down",
    value: function _down(pos) {
      var data = this.data,
          compare = this.compare;
      var halfLength = this.length >> 1;
      var item = data[pos];

      while (pos < halfLength) {
        var left = (pos << 1) + 1;
        var best = data[left];
        var right = left + 1;

        if (right < this.length && compare(data[right], best) < 0) {
          left = right;
          best = data[right];
        }

        if (compare(best, item) >= 0) break;
        data[pos] = best;
        pos = left;
      }

      data[pos] = item;
    }
  }]);

  return TinyQueue;
}();

//exports.default = TinyQueue;

function defaultCompare(a, b) {
  return a.totalWeight < b.totalWeight ? -1 : a.totalWeight > b.totalWeight ? 1 : 0;
}
