// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  // @internal
  countLength() {
    let length5 = 0;
    for (let _ of this)
      length5++;
    return length5;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index3) {
    return this.buffer[index3];
  }
  // @internal
  floatFromSlice(start3, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start3, end, isBigEndian);
  }
  // @internal
  intFromSlice(start3, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start3, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start3, end) {
    return new _BitArray(this.buffer.slice(start3, end));
  }
  // @internal
  sliceAfter(index3) {
    return new _BitArray(this.buffer.slice(index3));
  }
};
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  let value2 = 0;
  if (isBigEndian) {
    for (let i = start3; i < end; i++) {
      value2 = value2 * 256 + byteArray[i];
    }
  } else {
    for (let i = end - 1; i >= start3; i--) {
      value2 = value2 * 256 + byteArray[i];
    }
  }
  if (isSigned) {
    const byteSize = end - start3;
    const highBit = 2 ** (byteSize * 8 - 1);
    if (value2 >= highBit) {
      value2 -= highBit * 2;
    }
  }
  return value2;
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view4 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view4.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view4.getFloat32(start3, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value2) {
    super();
    this[0] = value2;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a = values.pop();
    let b = values.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a);
    for (let k of keys2(a)) {
      values.push(get2(a, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a = option[0];
    return new Ok(a);
  } else {
    return new Error(e);
  }
}
function from_result(result) {
  if (result.isOk()) {
    let a = result[0];
    return new Some(a);
  } else {
    return new None();
  }
}
function then$(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return fun(x);
  } else {
    return new None();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function parse(string4) {
  return parse_int(string4);
}
function to_string2(x) {
  return to_string(x);
}
function compare(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Continue = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Stop = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function count_length(loop$list, loop$count) {
  while (true) {
    let list = loop$list;
    let count = loop$count;
    if (list.atLeastLength(1)) {
      let list$1 = list.tail;
      loop$list = list$1;
      loop$count = count + 1;
    } else {
      return count;
    }
  }
}
function length(list) {
  return count_length(list, 0);
}
function do_reverse(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(xs) {
  return do_reverse(xs, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list = loop$list;
    let elem = loop$elem;
    if (list.hasLength(0)) {
      return false;
    } else if (list.atLeastLength(1) && isEqual(list.head, elem)) {
      let first$1 = list.head;
      return true;
    } else {
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$elem = elem;
    }
  }
}
function do_filter(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list.head;
      let xs = list.tail;
      let new_acc = (() => {
        let $ = fun(x);
        if ($) {
          return prepend(x, acc);
        } else {
          return acc;
        }
      })();
      loop$list = xs;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list, predicate) {
  return do_filter(list, predicate, toList([]));
}
function do_filter_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list.head;
      let xs = list.tail;
      let new_acc = (() => {
        let $ = fun(x);
        if ($.isOk()) {
          let x$1 = $[0];
          return prepend(x$1, acc);
        } else {
          return acc;
        }
      })();
      loop$list = xs;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list, fun) {
  return do_filter_map(list, fun, toList([]));
}
function do_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list.head;
      let xs = list.tail;
      loop$list = xs;
      loop$fun = fun;
      loop$acc = prepend(fun(x), acc);
    }
  }
}
function map(list, fun) {
  return do_map(list, fun, toList([]));
}
function do_index_map(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let index3 = loop$index;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list.head;
      let xs = list.tail;
      let acc$1 = prepend(fun(x, index3), acc);
      loop$list = xs;
      loop$fun = fun;
      loop$index = index3 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list, fun) {
  return do_index_map(list, fun, 0, toList([]));
}
function drop(loop$list, loop$n) {
  while (true) {
    let list = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list;
    } else {
      if (list.hasLength(0)) {
        return toList([]);
      } else {
        let xs = list.tail;
        loop$list = xs;
        loop$n = n - 1;
      }
    }
  }
}
function do_take(loop$list, loop$n, loop$acc) {
  while (true) {
    let list = loop$list;
    let n = loop$n;
    let acc = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse(acc);
    } else {
      if (list.hasLength(0)) {
        return reverse(acc);
      } else {
        let x = list.head;
        let xs = list.tail;
        loop$list = xs;
        loop$n = n - 1;
        loop$acc = prepend(x, acc);
      }
    }
  }
}
function take(list, n) {
  return do_take(list, n, toList([]));
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function do_concat(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list, acc);
    }
  }
}
function concat(lists) {
  return do_concat(lists, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list.hasLength(0)) {
      return initial;
    } else {
      let x = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}
function do_index_fold(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index3 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index3);
      loop$with = with$;
      loop$index = index3 + 1;
    }
  }
}
function index_fold(over, initial, fun) {
  return do_index_fold(over, initial, fun, 0);
}
function try_fold(loop$collection, loop$accumulator, loop$fun) {
  while (true) {
    let collection = loop$collection;
    let accumulator = loop$accumulator;
    let fun = loop$fun;
    if (collection.hasLength(0)) {
      return new Ok(accumulator);
    } else {
      let first$1 = collection.head;
      let rest$1 = collection.tail;
      let $ = fun(accumulator, first$1);
      if ($.isOk()) {
        let result = $[0];
        loop$collection = rest$1;
        loop$accumulator = result;
        loop$fun = fun;
      } else {
        let error = $;
        return error;
      }
    }
  }
}
function fold_until(loop$collection, loop$accumulator, loop$fun) {
  while (true) {
    let collection = loop$collection;
    let accumulator = loop$accumulator;
    let fun = loop$fun;
    if (collection.hasLength(0)) {
      return accumulator;
    } else {
      let first$1 = collection.head;
      let rest$1 = collection.tail;
      let $ = fun(accumulator, first$1);
      if ($ instanceof Continue) {
        let next_accumulator = $[0];
        loop$collection = rest$1;
        loop$accumulator = next_accumulator;
        loop$fun = fun;
      } else {
        let b = $[0];
        return b;
      }
    }
  }
}
function unique(list) {
  if (list.hasLength(0)) {
    return toList([]);
  } else {
    let x = list.head;
    let rest$1 = list.tail;
    return prepend(
      x,
      unique(filter(rest$1, (y) => {
        return !isEqual(y, x);
      }))
    );
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list.hasLength(0)) {
      if (direction instanceof Ascending) {
        return prepend(do_reverse(growing$1, toList([])), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare4(prev, new$1);
      if ($ instanceof Gt && direction instanceof Descending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Lt && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Eq && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Gt && direction instanceof Ascending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(do_reverse(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next2);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Lt && direction instanceof Descending) {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(do_reverse(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next2);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      } else {
        let acc$1 = (() => {
          if (direction instanceof Ascending) {
            return prepend(do_reverse(growing$1, toList([])), acc);
          } else {
            return prepend(growing$1, acc);
          }
        })();
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next2 = rest$1.head;
          let rest$2 = rest$1.tail;
          let direction$1 = (() => {
            let $1 = compare4(new$1, next2);
            if ($1 instanceof Lt) {
              return new Ascending();
            } else if ($1 instanceof Eq) {
              return new Ascending();
            } else {
              return new Descending();
            }
          })();
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next2;
          loop$acc = acc$1;
        }
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list = list2;
      return do_reverse(list, acc);
    } else if (list2.hasLength(0)) {
      let list = list1;
      return do_reverse(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first22 = list2.head;
      let rest2 = list2.tail;
      let $ = compare4(first1, first22);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first22, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first22, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return do_reverse(acc, toList([]));
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return do_reverse(
        prepend(do_reverse(sequence, toList([])), acc),
        toList([])
      );
    } else {
      let ascending1 = sequences2.head;
      let ascending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let descending = merge_ascendings(
        ascending1,
        ascending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(descending, acc);
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list = list2;
      return do_reverse(list, acc);
    } else if (list2.hasLength(0)) {
      let list = list1;
      return do_reverse(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first22 = list2.head;
      let rest2 = list2.tail;
      let $ = compare4(first1, first22);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first22, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return do_reverse(acc, toList([]));
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return do_reverse(
        prepend(do_reverse(sequence, toList([])), acc),
        toList([])
      );
    } else {
      let descending1 = sequences2.head;
      let descending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let ascending = merge_descendings(
        descending1,
        descending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(ascending, acc);
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2.hasLength(0)) {
      return toList([]);
    } else if (sequences2.hasLength(1) && direction instanceof Ascending) {
      let sequence = sequences2.head;
      return sequence;
    } else if (sequences2.hasLength(1) && direction instanceof Descending) {
      let sequence = sequences2.head;
      return do_reverse(sequence, toList([]));
    } else if (direction instanceof Ascending) {
      let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Descending();
      loop$compare = compare4;
    } else {
      let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Ascending();
      loop$compare = compare4;
    }
  }
}
function sort(list, compare4) {
  if (list.hasLength(0)) {
    return toList([]);
  } else if (list.hasLength(1)) {
    let x = list.head;
    return toList([x]);
  } else {
    let x = list.head;
    let y = list.tail.head;
    let rest$1 = list.tail.tail;
    let direction = (() => {
      let $ = compare4(x, y);
      if ($ instanceof Lt) {
        return new Ascending();
      } else if ($ instanceof Eq) {
        return new Ascending();
      } else {
        return new Descending();
      }
    })();
    let sequences$1 = sequences(
      rest$1,
      compare4,
      toList([x]),
      direction,
      y,
      toList([])
    );
    return merge_all(sequences$1, new Ascending(), compare4);
  }
}
function tail_recursive_range(loop$start, loop$stop, loop$acc) {
  while (true) {
    let start3 = loop$start;
    let stop2 = loop$stop;
    let acc = loop$acc;
    let $ = compare(start3, stop2);
    if ($ instanceof Eq) {
      return prepend(stop2, acc);
    } else if ($ instanceof Gt) {
      loop$start = start3;
      loop$stop = stop2 + 1;
      loop$acc = prepend(stop2, acc);
    } else {
      loop$start = start3;
      loop$stop = stop2 - 1;
      loop$acc = prepend(stop2, acc);
    }
  }
}
function range(start3, stop2) {
  return tail_recursive_range(start3, stop2, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map2(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function replace_error(result, error) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/iterator.mjs
var Stop2 = class extends CustomType {
};
var Continue2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Iterator = class extends CustomType {
  constructor(continuation) {
    super();
    this.continuation = continuation;
  }
};
var Next = class extends CustomType {
  constructor(element2, accumulator) {
    super();
    this.element = element2;
    this.accumulator = accumulator;
  }
};
var Done = class extends CustomType {
};
function stop() {
  return new Stop2();
}
function do_unfold(initial, f) {
  return () => {
    let $ = f(initial);
    if ($ instanceof Next) {
      let x = $.element;
      let acc = $.accumulator;
      return new Continue2(x, do_unfold(acc, f));
    } else {
      return new Stop2();
    }
  };
}
function unfold(initial, f) {
  let _pipe = initial;
  let _pipe$1 = do_unfold(_pipe, f);
  return new Iterator(_pipe$1);
}
function do_drop(loop$continuation, loop$desired) {
  while (true) {
    let continuation = loop$continuation;
    let desired = loop$desired;
    let $ = continuation();
    if ($ instanceof Stop2) {
      return new Stop2();
    } else {
      let e = $[0];
      let next2 = $[1];
      let $1 = desired > 0;
      if ($1) {
        loop$continuation = next2;
        loop$desired = desired - 1;
      } else {
        return new Continue2(e, next2);
      }
    }
  }
}
function drop2(iterator, desired) {
  let _pipe = () => {
    return do_drop(iterator.continuation, desired);
  };
  return new Iterator(_pipe);
}
function do_map2(continuation, f) {
  return () => {
    let $ = continuation();
    if ($ instanceof Stop2) {
      return new Stop2();
    } else {
      let e = $[0];
      let continuation$1 = $[1];
      return new Continue2(f(e), do_map2(continuation$1, f));
    }
  };
}
function map3(iterator, f) {
  let _pipe = iterator.continuation;
  let _pipe$1 = do_map2(_pipe, f);
  return new Iterator(_pipe$1);
}
function do_filter2(loop$continuation, loop$predicate) {
  while (true) {
    let continuation = loop$continuation;
    let predicate = loop$predicate;
    let $ = continuation();
    if ($ instanceof Stop2) {
      return new Stop2();
    } else {
      let e = $[0];
      let iterator = $[1];
      let $1 = predicate(e);
      if ($1) {
        return new Continue2(e, () => {
          return do_filter2(iterator, predicate);
        });
      } else {
        loop$continuation = iterator;
        loop$predicate = predicate;
      }
    }
  }
}
function filter2(iterator, predicate) {
  let _pipe = () => {
    return do_filter2(iterator.continuation, predicate);
  };
  return new Iterator(_pipe);
}
function once(f) {
  let _pipe = () => {
    return new Continue2(f(), stop);
  };
  return new Iterator(_pipe);
}
function range2(start3, stop2) {
  let $ = compare(start3, stop2);
  if ($ instanceof Eq) {
    return once(() => {
      return start3;
    });
  } else if ($ instanceof Gt) {
    return unfold(
      start3,
      (current) => {
        let $1 = current < stop2;
        if (!$1) {
          return new Next(current, current - 1);
        } else {
          return new Done();
        }
      }
    );
  } else {
    return unfold(
      start3,
      (current) => {
        let $1 = current > stop2;
        if (!$1) {
          return new Next(current, current + 1);
        } else {
          return new Done();
        }
      }
    );
  }
}
function first(iterator) {
  let $ = iterator.continuation();
  if ($ instanceof Stop2) {
    return new Error(void 0);
  } else {
    let e = $[0];
    return new Ok(e);
  }
}
function at(iterator, index3) {
  let _pipe = iterator;
  let _pipe$1 = drop2(_pipe, index3);
  return first(_pipe$1);
}

// build/dev/javascript/gleam_stdlib/gleam/string_builder.mjs
function from_strings(strings) {
  return concat2(strings);
}
function from_string(string4) {
  return identity(string4);
}
function to_string3(builder) {
  return identity(builder);
}
function split2(iodata, pattern) {
  return split(iodata, pattern);
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function length3(string4) {
  return string_length(string4);
}
function compare3(a, b) {
  let $ = a === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = less_than(a, b);
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function split_once2(x, substring) {
  return split_once(x, substring);
}
function concat3(strings) {
  let _pipe = strings;
  let _pipe$1 = from_strings(_pipe);
  return to_string3(_pipe$1);
}
function join2(strings, separator) {
  return join(strings, separator);
}
function trim2(string4) {
  return trim(string4);
}
function do_slice(string4, idx, len) {
  let _pipe = string4;
  let _pipe$1 = graphemes(_pipe);
  let _pipe$2 = drop(_pipe$1, idx);
  let _pipe$3 = take(_pipe$2, len);
  return concat3(_pipe$3);
}
function slice(string4, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = length3(string4) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return do_slice(string4, translated_idx, len);
      }
    } else {
      return do_slice(string4, idx, len);
    }
  }
}
function drop_left(string4, num_graphemes) {
  let $ = num_graphemes < 0;
  if ($) {
    return string4;
  } else {
    return slice(string4, num_graphemes, length3(string4) - num_graphemes);
  }
}
function split3(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = from_string(_pipe);
    let _pipe$2 = split2(_pipe$1, substring);
    return map(_pipe$2, to_string3);
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return to_string3(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/bit_array.mjs
function to_string4(bits) {
  return bit_array_to_string(bits);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path2) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path2;
  }
};
function classify(data) {
  return classify_dynamic(data);
}
function int(data) {
  return decode_int(data);
}
function any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return any(decoders$1)(data);
      }
    }
  };
}
function push_path(error, name) {
  let name$1 = identity(name);
  let decoder = any(
    toList([string2, (x) => {
      return map2(int(x), to_string2);
    }])
  );
  let name$2 = (() => {
    let $ = decoder(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify(name$1), ">"]);
      let _pipe$1 = from_strings(_pipe);
      return to_string3(_pipe$1);
    }
  })();
  return error.withFields({ path: prepend(name$2, error.path) });
}
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map(_capture, f);
    }
  );
}
function string2(data) {
  return decode_string(data);
}
function field(name, inner_type) {
  return (value2) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value2, name),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name);
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at2] = val;
  return out;
}
function spliceIn(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at2) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key2, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key2, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key2, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key2, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key2, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key2, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key2, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key2, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key2, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key2, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key2, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key2,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key2, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key2);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key2, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key2,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key2) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key2, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key2);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return findCollision(root, key2);
  }
}
function findArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key2);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return withoutCollision(root, key2);
  }
}
function withoutArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key2)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key2, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key2, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key2), key2);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key2, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key2), key2, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key2) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key2), key2);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key2) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key2), key2) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    let equal = true;
    this.forEach((v, k) => {
      equal = equal && isEqual(o.get(k, !v), v);
    });
    return equal;
  }
};

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value2) {
  if (/^[-+]?(\d+)$/.test(value2)) {
    return new Ok(parseInt(value2));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function string_length(string4) {
  if (string4 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string4.match(/./gsu).length;
  }
}
function graphemes(string4) {
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string4.match(/./gsu));
  }
}
function graphemes_iterator(string4) {
  if (globalThis.Intl && Intl.Segmenter) {
    return new Intl.Segmenter().segment(string4)[Symbol.iterator]();
  }
}
function less_than(a, b) {
  return a < b;
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat2(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function length2(data) {
  return data.length;
}
function split_once(haystack, needle) {
  const index3 = haystack.indexOf(needle);
  if (index3 >= 0) {
    const before = haystack.slice(0, index3);
    const after = haystack.slice(index3 + needle.length);
    return new Ok([before, after]);
  } else {
    return new Error(Nil);
  }
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var left_trim_regex = new RegExp(`^([${unicode_whitespaces}]*)`, "g");
var right_trim_regex = new RegExp(`([${unicode_whitespaces}]*)$`, "g");
function trim(string4) {
  return trim_left(trim_right(string4));
}
function trim_left(string4) {
  return string4.replace(left_trim_regex, "");
}
function trim_right(string4) {
  return string4.replace(right_trim_regex, "");
}
function bit_array_to_string(bit_array) {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return new Ok(decoder.decode(bit_array.buffer));
  } catch {
    return new Error(Nil);
  }
}
function bit_array_slice(bits, position, length5) {
  const start3 = Math.min(position, position + length5);
  const end = Math.max(position, position + length5);
  if (start3 < 0 || end > bits.length)
    return new Error(Nil);
  const byteOffset = bits.buffer.byteOffset + start3;
  const buffer = new Uint8Array(
    bits.buffer.buffer,
    byteOffset,
    Math.abs(length5)
  );
  return new Ok(new BitArray(buffer));
}
function new_map() {
  return Dict.new();
}
function map_to_list(map9) {
  return List.fromArray(map9.entries());
}
function map_get(map9, key2) {
  const value2 = map9.get(key2, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key2, value2, map9) {
  return map9.set(key2, value2);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_field(value2, name) {
  const not_a_map_error = () => decoder_error("Dict", value2);
  if (value2 instanceof Dict || value2 instanceof WeakMap || value2 instanceof Map) {
    const entry = map_get(value2, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value2 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value2) == Object.prototype) {
    return try_get_field(value2, name, () => new Ok(new None()));
  } else {
    return try_get_field(value2, name, not_a_map_error);
  }
}
function try_get_field(value2, field2, or_else) {
  try {
    return field2 in value2 ? new Ok(new Some(value2[field2])) : or_else();
  } catch {
    return or_else();
  }
}
function bitwise_shift_left(x, y) {
  return Number(BigInt(x) << BigInt(y));
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return inspectString(v);
  if (t === "bigint" || t === "number")
    return v.toString();
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return inspectBitArray(v);
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map9) {
  let body = "dict.from_list([";
  let first3 = true;
  map9.forEach((value2, key2) => {
    if (!first3)
      body = body + ", ";
    body = body + "#(" + inspect(key2) + ", " + inspect(value2) + ")";
    first3 = false;
  });
  return body + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label) => {
    const value2 = inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list) {
  return `[${list.toArray().map(inspect).join(", ")}]`;
}
function inspectBitArray(bits) {
  return `<<${Array.from(bits.buffer).join(", ")}>>`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function new$() {
  return new_map();
}
function get(from, get2) {
  return map_get(from, get2);
}
function insert(dict, key2, value2) {
  return map_insert(key2, value2, dict);
}
function fold_list_of_pair(loop$list, loop$initial) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    if (list.hasLength(0)) {
      return initial;
    } else {
      let x = list.head;
      let rest = list.tail;
      loop$list = rest;
      loop$initial = insert(initial, x[0], x[1]);
    }
  }
}
function from_list(list) {
  return fold_list_of_pair(list, new$());
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function do_keys_acc(loop$list, loop$acc) {
  while (true) {
    let list = loop$list;
    let acc = loop$acc;
    if (list.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let x = list.head;
      let xs = list.tail;
      loop$list = xs;
      loop$acc = prepend(x[0], acc);
    }
  }
}
function do_keys(dict) {
  let list_of_pairs = map_to_list(dict);
  return do_keys_acc(list_of_pairs, toList([]));
}
function keys(dict) {
  return do_keys(dict);
}
function insert_pair(dict, pair) {
  return insert(dict, pair[0], pair[1]);
}
function fold_inserts(loop$new_entries, loop$dict) {
  while (true) {
    let new_entries = loop$new_entries;
    let dict = loop$dict;
    if (new_entries.hasLength(0)) {
      return dict;
    } else {
      let x = new_entries.head;
      let xs = new_entries.tail;
      loop$new_entries = xs;
      loop$dict = insert_pair(dict, x);
    }
  }
}
function do_merge(dict, new_entries) {
  let _pipe = new_entries;
  let _pipe$1 = map_to_list(_pipe);
  return fold_inserts(_pipe$1, dict);
}
function merge(dict, new_entries) {
  return do_merge(dict, new_entries);
}
function upsert(dict, key2, fun) {
  let _pipe = dict;
  let _pipe$1 = get(_pipe, key2);
  let _pipe$2 = from_result(_pipe$1);
  let _pipe$3 = fun(_pipe$2);
  return ((_capture) => {
    return insert(dict, key2, _capture);
  })(_pipe$3);
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/kielet/kielet/mo.mjs
var SingularStr = class extends CustomType {
  constructor(context, content) {
    super();
    this.context = context;
    this.content = content;
  }
};
var PluralStr = class extends CustomType {
  constructor(context, content) {
    super();
    this.context = context;
    this.content = content;
  }
};
var Singular = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Plural = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var NoContext = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var WithContext = class extends CustomType {
  constructor(context, content) {
    super();
    this.context = context;
    this.content = content;
  }
};
var BigEndian = class extends CustomType {
};
var LittleEndian = class extends CustomType {
};
var MagicNumberNotFound = class extends CustomType {
};
var MalformedHeader = class extends CustomType {
};
var UnknownRevision = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var OffsetPastEnd = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var MalformedOffsetTableEntry = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var StringNotUTF8 = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var MetaItemMissing = class extends CustomType {
};
var MetaItemIsNotSingular = class extends CustomType {
};
var PluralFormWithZeroEntries = class extends CustomType {
  constructor(index3) {
    super();
    this.index = index3;
  }
};
var Revision = class extends CustomType {
  constructor(major, minor) {
    super();
    this.major = major;
    this.minor = minor;
  }
};
var Header = class extends CustomType {
  constructor(revision, string_count, og_table_offset, trans_table_offset, ht_size, ht_offset) {
    super();
    this.revision = revision;
    this.string_count = string_count;
    this.og_table_offset = og_table_offset;
    this.trans_table_offset = trans_table_offset;
    this.ht_size = ht_size;
    this.ht_offset = ht_offset;
  }
};
var Mo = class extends CustomType {
  constructor(endianness, header, translations, metadata) {
    super();
    this.endianness = endianness;
    this.header = header;
    this.translations = translations;
    this.metadata = metadata;
  }
};
var EndiannessHandler = class extends CustomType {
  constructor(int_8, int_32) {
    super();
    this.int_8 = int_8;
    this.int_32 = int_32;
  }
};
function parse_magic(body) {
  if (body.intFromSlice(0, 4, true, false) === 3725722773 && body.length >= 4) {
    let rest = body.sliceAfter(4);
    return new Ok([new LittleEndian(), rest]);
  } else if (body.intFromSlice(0, 4, true, false) === 2500072158 && body.length >= 4) {
    let rest = body.sliceAfter(4);
    return new Ok([new BigEndian(), rest]);
  } else {
    return new Error(new MagicNumberNotFound());
  }
}
function parse_header(eh, body) {
  if (body.length >= 24) {
    let major_bytes = body.binaryFromSlice(0, 2);
    let minor_bytes = body.binaryFromSlice(2, 4);
    let string_count_bytes = body.binaryFromSlice(4, 8);
    let og_table_offset_bytes = body.binaryFromSlice(8, 12);
    let trans_table_offset_bytes = body.binaryFromSlice(12, 16);
    let ht_size_bytes = body.binaryFromSlice(16, 20);
    let ht_offset_bytes = body.binaryFromSlice(20, 24);
    let $ = eh.int_8(major_bytes);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "kielet/mo",
        191,
        "parse_header",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let major = $[0];
    let $1 = eh.int_8(minor_bytes);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "kielet/mo",
        192,
        "parse_header",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let minor = $1[0];
    let $2 = eh.int_32(string_count_bytes);
    if (!$2.isOk()) {
      throw makeError(
        "let_assert",
        "kielet/mo",
        193,
        "parse_header",
        "Pattern match failed, no pattern matched the value.",
        { value: $2 }
      );
    }
    let string_count = $2[0];
    let $3 = eh.int_32(og_table_offset_bytes);
    if (!$3.isOk()) {
      throw makeError(
        "let_assert",
        "kielet/mo",
        194,
        "parse_header",
        "Pattern match failed, no pattern matched the value.",
        { value: $3 }
      );
    }
    let og_table_offset = $3[0];
    let $4 = eh.int_32(trans_table_offset_bytes);
    if (!$4.isOk()) {
      throw makeError(
        "let_assert",
        "kielet/mo",
        195,
        "parse_header",
        "Pattern match failed, no pattern matched the value.",
        { value: $4 }
      );
    }
    let trans_table_offset = $4[0];
    let $5 = eh.int_32(ht_size_bytes);
    if (!$5.isOk()) {
      throw makeError(
        "let_assert",
        "kielet/mo",
        196,
        "parse_header",
        "Pattern match failed, no pattern matched the value.",
        { value: $5 }
      );
    }
    let ht_size = $5[0];
    let $6 = eh.int_32(ht_offset_bytes);
    if (!$6.isOk()) {
      throw makeError(
        "let_assert",
        "kielet/mo",
        197,
        "parse_header",
        "Pattern match failed, no pattern matched the value.",
        { value: $6 }
      );
    }
    let ht_offset = $6[0];
    return new Ok(
      new Header(
        new Revision(major, minor),
        string_count,
        og_table_offset,
        trans_table_offset,
        ht_size,
        ht_offset
      )
    );
  } else {
    return new Error(new MalformedHeader());
  }
}
function parse_offset_table_entry(eh, mo, offset) {
  return try$(
    (() => {
      let _pipe = bit_array_slice(mo, offset, 8);
      return replace_error(_pipe, new OffsetPastEnd(offset));
    })(),
    (data) => {
      if (data.length == 8) {
        let target_length = data.binaryFromSlice(0, 4);
        let target_offset = data.binaryFromSlice(4, 8);
        let $ = eh.int_32(target_length);
        if (!$.isOk()) {
          throw makeError(
            "let_assert",
            "kielet/mo",
            286,
            "",
            "Pattern match failed, no pattern matched the value.",
            { value: $ }
          );
        }
        let target_length$1 = $[0];
        let $1 = eh.int_32(target_offset);
        if (!$1.isOk()) {
          throw makeError(
            "let_assert",
            "kielet/mo",
            287,
            "",
            "Pattern match failed, no pattern matched the value.",
            { value: $1 }
          );
        }
        let target_offset$1 = $1[0];
        return new Ok([target_length$1, target_offset$1]);
      } else {
        return new Error(new MalformedOffsetTableEntry(data));
      }
    }
  );
}
function parse_metadata(translations) {
  return try$(
    (() => {
      let _pipe = get(translations, new NoContext(""));
      return replace_error(_pipe, new MetaItemMissing());
    })(),
    (meta) => {
      if (meta instanceof Plural) {
        return new Error(new MetaItemIsNotSingular());
      } else {
        let content = meta.content;
        let metadata = (() => {
          let _pipe = content;
          let _pipe$1 = split3(_pipe, "\n");
          let _pipe$2 = map(
            _pipe$1,
            (line) => {
              return split3(line, ":");
            }
          );
          let _pipe$3 = map(
            _pipe$2,
            (item) => {
              if (item.hasLength(0)) {
                return ["", ""];
              } else if (item.hasLength(1)) {
                let key2 = item.head;
                return [trim2(key2), ""];
              } else {
                let key2 = item.head;
                let rest = item.tail;
                return [
                  trim2(key2),
                  trim2(join2(rest, ":"))
                ];
              }
            }
          );
          return from_list(_pipe$3);
        })();
        return new Ok(metadata);
      }
    }
  );
}
function reconstruct_ui8(h, l) {
  return bitwise_shift_left(h, 8) + l;
}
function le_int_8(int8) {
  if (int8.length == 2) {
    let l = int8.byteAt(0);
    let h = int8.byteAt(1);
    return new Ok(reconstruct_ui8(h, l));
  } else {
    return new Error(void 0);
  }
}
function be_int_8(int8) {
  if (int8.length == 2) {
    let h = int8.byteAt(0);
    let l = int8.byteAt(1);
    return new Ok(reconstruct_ui8(h, l));
  } else {
    return new Error(void 0);
  }
}
function reconstruct_ui32(hh, hl, lh, ll) {
  return bitwise_shift_left(hh, 8 * 3) + bitwise_shift_left(
    hl,
    8 * 2
  ) + bitwise_shift_left(lh, 8) + ll;
}
function le_int_32(int32) {
  if (int32.length == 4) {
    let ll = int32.byteAt(0);
    let lh = int32.byteAt(1);
    let hl = int32.byteAt(2);
    let hh = int32.byteAt(3);
    return new Ok(reconstruct_ui32(hh, hl, lh, ll));
  } else {
    return new Error(void 0);
  }
}
function be_int_32(int32) {
  if (int32.length == 4) {
    let hh = int32.byteAt(0);
    let hl = int32.byteAt(1);
    let lh = int32.byteAt(2);
    let ll = int32.byteAt(3);
    return new Ok(reconstruct_ui32(hh, hl, lh, ll));
  } else {
    return new Error(void 0);
  }
}
var max_supported_major = 0;
var eot = "";
var nul = "\0";
function parse_mo_string(mo, length5, offset) {
  return try$(
    (() => {
      let _pipe = bit_array_slice(mo, offset, length5);
      return replace_error(_pipe, new OffsetPastEnd(offset));
    })(),
    (data) => {
      return try$(
        (() => {
          let _pipe = to_string4(data);
          return replace_error(_pipe, new StringNotUTF8(data));
        })(),
        (str) => {
          let $ = (() => {
            let $12 = split_once2(str, eot);
            if ($12.isOk()) {
              let c = $12[0][0];
              let s = $12[0][1];
              return [new Some(c), s];
            } else {
              return [new None(), str];
            }
          })();
          let context = $[0];
          let str$1 = $[1];
          let $1 = split3(str$1, nul);
          if ($1.hasLength(1)) {
            return new Ok(new SingularStr(context, str$1));
          } else {
            let plurals = $1;
            return new Ok(
              new PluralStr(
                context,
                (() => {
                  let _pipe = plurals;
                  let _pipe$1 = index_map(
                    _pipe,
                    (msg, i) => {
                      return [i, msg];
                    }
                  );
                  return from_list(_pipe$1);
                })()
              )
            );
          }
        }
      );
    }
  );
}
function parse_translation(eh, mo, og_offset, trans_offset) {
  return try$(
    parse_offset_table_entry(eh, mo, og_offset),
    (_use0) => {
      let og_str_length = _use0[0];
      let og_str_offset = _use0[1];
      return try$(
        parse_offset_table_entry(eh, mo, trans_offset),
        (_use02) => {
          let trans_str_length = _use02[0];
          let trans_str_offset = _use02[1];
          return try$(
            parse_mo_string(mo, og_str_length, og_str_offset),
            (og_string) => {
              return try$(
                parse_mo_string(mo, trans_str_length, trans_str_offset),
                (trans_string) => {
                  return new Ok([og_string, trans_string]);
                }
              );
            }
          );
        }
      );
    }
  );
}
function parse_translations(eh, header, mo) {
  let strings = range(0, header.string_count - 1);
  return try$(
    try_fold(
      strings,
      new$(),
      (translations, i) => {
        let new_offset = i * 8;
        let og_offset = header.og_table_offset + new_offset;
        let trans_offset = header.trans_table_offset + new_offset;
        return try$(
          parse_translation(eh, mo, og_offset, trans_offset),
          (_use0) => {
            let og = _use0[0];
            let translation = _use0[1];
            return try$(
              (() => {
                if (og instanceof SingularStr) {
                  let context = og.context;
                  let content = og.content;
                  if (context instanceof Some) {
                    let context$1 = context[0];
                    return new Ok(new WithContext(context$1, content));
                  } else {
                    return new Ok(new NoContext(content));
                  }
                } else {
                  let context = og.context;
                  let content = og.content;
                  let $ = get(content, 0);
                  if ($.isOk()) {
                    let content$1 = $[0];
                    if (context instanceof Some) {
                      let context$1 = context[0];
                      return new Ok(new WithContext(context$1, content$1));
                    } else {
                      return new Ok(new NoContext(content$1));
                    }
                  } else {
                    return new Error(new PluralFormWithZeroEntries(i));
                  }
                }
              })(),
              (key2) => {
                let translation_output = (() => {
                  if (translation instanceof SingularStr) {
                    let content = translation.content;
                    return new Singular(content);
                  } else {
                    let content = translation.content;
                    return new Plural(content);
                  }
                })();
                return new Ok(
                  insert(translations, key2, translation_output)
                );
              }
            );
          }
        );
      }
    ),
    (translations) => {
      return new Ok(translations);
    }
  );
}
function parse2(mo) {
  return try$(
    parse_magic(mo),
    (_use0) => {
      let endianness = _use0[0];
      let rest = _use0[1];
      let endianness_handler = (() => {
        if (endianness instanceof LittleEndian) {
          return new EndiannessHandler(le_int_8, le_int_32);
        } else {
          return new EndiannessHandler(be_int_8, be_int_32);
        }
      })();
      return try$(
        parse_header(endianness_handler, rest),
        (header) => {
          return guard(
            header.revision.major > max_supported_major,
            new Error(new UnknownRevision(header.revision)),
            () => {
              return guard(
                header.string_count === 0,
                new Ok(new Mo(endianness, header, new$(), new$())),
                () => {
                  let total_size = length2(mo);
                  return guard(
                    header.og_table_offset >= total_size,
                    new Error(new OffsetPastEnd(header.og_table_offset)),
                    () => {
                      return guard(
                        header.trans_table_offset >= total_size,
                        new Error(new OffsetPastEnd(header.trans_table_offset)),
                        () => {
                          return guard(
                            header.ht_offset >= total_size,
                            new Error(new OffsetPastEnd(header.ht_offset)),
                            () => {
                              return try$(
                                parse_translations(
                                  endianness_handler,
                                  header,
                                  mo
                                ),
                                (translations) => {
                                  return try$(
                                    parse_metadata(translations),
                                    (metadata) => {
                                      return new Ok(
                                        new Mo(
                                          endianness,
                                          header,
                                          translations,
                                          metadata
                                        )
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict) {
    super();
    this.dict = dict;
  }
};
function new$2() {
  return new Set2(new$());
}

// build/dev/javascript/nibble/nibble/lexer.mjs
var Token = class extends CustomType {
  constructor(span2, lexeme, value2) {
    super();
    this.span = span2;
    this.lexeme = lexeme;
    this.value = value2;
  }
};
var Span = class extends CustomType {
  constructor(row_start, col_start, row_end, col_end) {
    super();
    this.row_start = row_start;
    this.col_start = col_start;
    this.row_end = row_end;
    this.col_end = col_end;
  }
};

// build/dev/javascript/nibble/nibble.mjs
var Parser = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Cont = class extends CustomType {
  constructor(x0, x1, x2) {
    super();
    this[0] = x0;
    this[1] = x1;
    this[2] = x2;
  }
};
var Fail = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var State = class extends CustomType {
  constructor(src2, idx, pos, ctx) {
    super();
    this.src = src2;
    this.idx = idx;
    this.pos = pos;
    this.ctx = ctx;
  }
};
var CanBacktrack = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Continue3 = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Break = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var EndOfInput = class extends CustomType {
};
var Expected = class extends CustomType {
  constructor(x0, got) {
    super();
    this[0] = x0;
    this.got = got;
  }
};
var Unexpected = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var DeadEnd = class extends CustomType {
  constructor(pos, problem, context) {
    super();
    this.pos = pos;
    this.problem = problem;
    this.context = context;
  }
};
var Empty2 = class extends CustomType {
};
var Cons = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Append = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function runwrap(state, parser) {
  let parse6 = parser[0];
  return parse6(state);
}
function next(state) {
  let $ = get(state.src, state.idx);
  if (!$.isOk()) {
    return [new None(), state];
  } else {
    let span$1 = $[0].span;
    let tok = $[0].value;
    return [
      new Some(tok),
      state.withFields({ idx: state.idx + 1, pos: span$1 })
    ];
  }
}
function return$(value2) {
  return new Parser(
    (state) => {
      return new Cont(new CanBacktrack(false), value2, state);
    }
  );
}
function lazy(parser) {
  return new Parser((state) => {
    return runwrap(state, parser());
  });
}
function should_commit(a, b) {
  let a$1 = a[0];
  let b$1 = b[0];
  return new CanBacktrack(a$1 || b$1);
}
function do$(parser, f) {
  return new Parser(
    (state) => {
      let $ = runwrap(state, parser);
      if ($ instanceof Cont) {
        let to_a = $[0];
        let a = $[1];
        let state$1 = $[2];
        let $1 = runwrap(state$1, f(a));
        if ($1 instanceof Cont) {
          let to_b = $1[0];
          let b = $1[1];
          let state$2 = $1[2];
          return new Cont(should_commit(to_a, to_b), b, state$2);
        } else {
          let to_b = $1[0];
          let bag = $1[1];
          return new Fail(should_commit(to_a, to_b), bag);
        }
      } else {
        let can_backtrack = $[0];
        let bag = $[1];
        return new Fail(can_backtrack, bag);
      }
    }
  );
}
function map5(parser, f) {
  return do$(parser, (a) => {
    return return$(f(a));
  });
}
function loop_help(loop$f, loop$commit, loop$loop_state, loop$state) {
  while (true) {
    let f = loop$f;
    let commit = loop$commit;
    let loop_state = loop$loop_state;
    let state = loop$state;
    let $ = runwrap(state, f(loop_state));
    if ($ instanceof Cont && $[1] instanceof Continue3) {
      let can_backtrack = $[0];
      let next_loop_state = $[1][0];
      let next_state = $[2];
      loop$f = f;
      loop$commit = should_commit(commit, can_backtrack);
      loop$loop_state = next_loop_state;
      loop$state = next_state;
    } else if ($ instanceof Cont && $[1] instanceof Break) {
      let can_backtrack = $[0];
      let result = $[1][0];
      let next_state = $[2];
      return new Cont(should_commit(commit, can_backtrack), result, next_state);
    } else {
      let can_backtrack = $[0];
      let bag = $[1];
      return new Fail(should_commit(commit, can_backtrack), bag);
    }
  }
}
function loop(init3, step) {
  return new Parser(
    (state) => {
      return loop_help(step, new CanBacktrack(false), init3, state);
    }
  );
}
function bag_from_state(state, problem) {
  return new Cons(new Empty2(), new DeadEnd(state.pos, problem, state.ctx));
}
function token(tok) {
  return new Parser(
    (state) => {
      let $ = next(state);
      if ($[0] instanceof Some && isEqual(tok, $[0][0])) {
        let t = $[0][0];
        let state$1 = $[1];
        return new Cont(new CanBacktrack(true), void 0, state$1);
      } else if ($[0] instanceof Some) {
        let t = $[0][0];
        let state$1 = $[1];
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(state$1, new Expected(inspect2(tok), t))
        );
      } else {
        let state$1 = $[1];
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(state$1, new EndOfInput())
        );
      }
    }
  );
}
function eof() {
  return new Parser(
    (state) => {
      let $ = next(state);
      if ($[0] instanceof Some) {
        let tok = $[0][0];
        let state$1 = $[1];
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(state$1, new Unexpected(tok))
        );
      } else {
        return new Cont(new CanBacktrack(false), void 0, state);
      }
    }
  );
}
function take_map(expecting, f) {
  return new Parser(
    (state) => {
      let $ = next(state);
      let tok = $[0];
      let next_state = $[1];
      let $1 = then$(tok, f);
      if (tok instanceof None) {
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(next_state, new EndOfInput())
        );
      } else if (tok instanceof Some && $1 instanceof None) {
        let tok$1 = tok[0];
        return new Fail(
          new CanBacktrack(false),
          bag_from_state(next_state, new Expected(expecting, tok$1))
        );
      } else {
        let a = $1[0];
        return new Cont(new CanBacktrack(false), a, next_state);
      }
    }
  );
}
function to_deadends(loop$bag, loop$acc) {
  while (true) {
    let bag = loop$bag;
    let acc = loop$acc;
    if (bag instanceof Empty2) {
      return acc;
    } else if (bag instanceof Cons && bag[0] instanceof Empty2) {
      let deadend = bag[1];
      return prepend(deadend, acc);
    } else if (bag instanceof Cons) {
      let bag$1 = bag[0];
      let deadend = bag[1];
      loop$bag = bag$1;
      loop$acc = prepend(deadend, acc);
    } else {
      let left2 = bag[0];
      let right2 = bag[1];
      loop$bag = left2;
      loop$acc = to_deadends(right2, acc);
    }
  }
}
function run(src2, parser) {
  let src$1 = index_fold(
    src2,
    new$(),
    (dict, tok, idx) => {
      return insert(dict, idx, tok);
    }
  );
  let init3 = new State(src$1, 0, new Span(1, 1, 1, 1), toList([]));
  let $ = runwrap(init3, parser);
  if ($ instanceof Cont) {
    let a = $[1];
    return new Ok(a);
  } else {
    let bag = $[1];
    return new Error(to_deadends(bag, toList([])));
  }
}
function add_bag_to_step(step, left2) {
  if (step instanceof Cont) {
    let can_backtrack = step[0];
    let a = step[1];
    let state = step[2];
    return new Cont(can_backtrack, a, state);
  } else {
    let can_backtrack = step[0];
    let right2 = step[1];
    return new Fail(can_backtrack, new Append(left2, right2));
  }
}
function one_of(parsers) {
  return new Parser(
    (state) => {
      let init3 = new Fail(new CanBacktrack(false), new Empty2());
      return fold_until(
        parsers,
        init3,
        (result, next2) => {
          if (result instanceof Cont) {
            return new Stop(result);
          } else if (result instanceof Fail && result[0] instanceof CanBacktrack && result[0][0]) {
            return new Stop(result);
          } else {
            let bag = result[1];
            let _pipe = runwrap(state, next2);
            let _pipe$1 = add_bag_to_step(_pipe, bag);
            return new Continue(_pipe$1);
          }
        }
      );
    }
  );
}
function optional(parser) {
  return one_of(
    toList([
      map5(parser, (var0) => {
        return new Some(var0);
      }),
      return$(new None())
    ])
  );
}

// build/dev/javascript/kielet/kielet/plurals/ast.mjs
var Equal = class extends CustomType {
};
var NotEqual = class extends CustomType {
};
var GreaterThan = class extends CustomType {
};
var GreaterThanOrEqual = class extends CustomType {
};
var LowerThan = class extends CustomType {
};
var LowerThanOrEqual = class extends CustomType {
};
var Remainder = class extends CustomType {
};
var And = class extends CustomType {
};
var Or = class extends CustomType {
};
var N = class extends CustomType {
};
var Integer = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var BinaryOperation = class extends CustomType {
  constructor(operator, lvalue, rvalue) {
    super();
    this.operator = operator;
    this.lvalue = lvalue;
    this.rvalue = rvalue;
  }
};
var If = class extends CustomType {
  constructor(condition, truthy, falsy) {
    super();
    this.condition = condition;
    this.truthy = truthy;
    this.falsy = falsy;
  }
};
var Paren = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/nibble/nibble/pratt.mjs
var Config = class extends CustomType {
  constructor(one_of2, and_then_one_of, spaces) {
    super();
    this.one_of = one_of2;
    this.and_then_one_of = and_then_one_of;
    this.spaces = spaces;
  }
};
var Operator = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function operation(expr, config, current_precedence) {
  let _pipe = config.and_then_one_of;
  let _pipe$1 = filter_map(
    _pipe,
    (operator) => {
      let op = operator[0];
      let $ = op(config);
      if ($[0] > current_precedence) {
        let precedence = $[0];
        let parser = $[1];
        return new Ok(parser(expr));
      } else {
        return new Error(void 0);
      }
    }
  );
  return one_of(_pipe$1);
}
function sub_expression(config, precedence) {
  let expr = lazy(
    () => {
      let _pipe = config.one_of;
      let _pipe$1 = map(_pipe, (p) => {
        return p(config);
      });
      return one_of(_pipe$1);
    }
  );
  let go = (expr2) => {
    return do$(
      config.spaces,
      (_) => {
        return one_of(
          toList([
            (() => {
              let _pipe = operation(expr2, config, precedence);
              return map5(
                _pipe,
                (var0) => {
                  return new Continue3(var0);
                }
              );
            })(),
            (() => {
              let _pipe = return$(expr2);
              return map5(
                _pipe,
                (var0) => {
                  return new Break(var0);
                }
              );
            })()
          ])
        );
      }
    );
  };
  return do$(
    config.spaces,
    (_) => {
      return do$(expr, (e) => {
        return loop(e, go);
      });
    }
  );
}
function expression(first3, then$3, spaces) {
  let config = new Config(first3, then$3, spaces);
  return sub_expression(config, 0);
}
function make_infix(precedence, operator, apply) {
  let left_precedence = precedence[0];
  let right_precedence = precedence[1];
  return new Operator(
    (config) => {
      return [
        left_precedence,
        (lhs) => {
          return do$(
            operator,
            (_) => {
              return do$(
                sub_expression(config, right_precedence),
                (subexpr) => {
                  return return$(apply(lhs, subexpr));
                }
              );
            }
          );
        }
      ];
    }
  );
}
function infix_left(precedence, operator, apply) {
  return make_infix([precedence, precedence], operator, apply);
}
function infix_right(precedence, operator, apply) {
  return make_infix([precedence, precedence - 1], operator, apply);
}

// build/dev/javascript/kielet/kielet/plurals/syntax_error.mjs
var SyntaxError = class extends CustomType {
  constructor(line, column, reason) {
    super();
    this.line = line;
    this.column = column;
    this.reason = reason;
  }
};

// build/dev/javascript/kielet/kielet/plurals/tokenizer.mjs
var N2 = class extends CustomType {
};
var NPlurals = class extends CustomType {
};
var Plural2 = class extends CustomType {
};
var Equals = class extends CustomType {
};
var NotEquals = class extends CustomType {
};
var GreaterThanOrEquals = class extends CustomType {
};
var LowerThanOrEquals = class extends CustomType {
};
var GreaterThan2 = class extends CustomType {
};
var LowerThan2 = class extends CustomType {
};
var Assignment = class extends CustomType {
};
var Ternary = class extends CustomType {
};
var TernaryElse = class extends CustomType {
};
var Remainder2 = class extends CustomType {
};
var Or2 = class extends CustomType {
};
var And2 = class extends CustomType {
};
var Semicolon = class extends CustomType {
};
var LParen = class extends CustomType {
};
var RParen = class extends CustomType {
};
var End = class extends CustomType {
};
var Int = class extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
};
function to_nibble(token2, lexeme, line, col) {
  return new Token(
    new Span(line, col, line, col + length3(lexeme)),
    lexeme,
    token2
  );
}
function read_digits(loop$str, loop$acc, loop$line, loop$col, loop$digit_acc) {
  while (true) {
    let str = loop$str;
    let acc = loop$acc;
    let line = loop$line;
    let col = loop$col;
    let digit_acc = loop$digit_acc;
    if (str.atLeastLength(1) && (str.head === "0" || str.head === "1" || str.head === "2" || str.head === "3" || str.head === "4" || str.head === "5" || str.head === "6" || str.head === "7" || str.head === "8" || str.head === "9")) {
      let digit = str.head;
      let rest = str.tail;
      loop$str = rest;
      loop$acc = acc;
      loop$line = line;
      loop$col = col + 1;
      loop$digit_acc = digit_acc + digit;
    } else {
      let other = str;
      let $ = parse(digit_acc);
      if ($.isOk()) {
        let int3 = $[0];
        return do_tokenize(
          other,
          prepend(to_nibble(new Int(int3), digit_acc, line, col), acc),
          line,
          col + length3(digit_acc)
        );
      } else {
        return new Error(
          new SyntaxError(
            line,
            new Some(col),
            "Unparseable integer " + digit_acc
          )
        );
      }
    }
  }
}
function do_tokenize(loop$str, loop$acc, loop$line, loop$col) {
  while (true) {
    let str = loop$str;
    let acc = loop$acc;
    let line = loop$line;
    let col = loop$col;
    if (str.hasLength(0)) {
      return new Ok(
        reverse(prepend(to_nibble(new End(), "", line, col), acc))
      );
    } else if (str.atLeastLength(8) && str.head === "n" && str.tail.head === "p" && str.tail.tail.head === "l" && str.tail.tail.tail.head === "u" && str.tail.tail.tail.tail.head === "r" && str.tail.tail.tail.tail.tail.head === "a" && str.tail.tail.tail.tail.tail.tail.head === "l" && str.tail.tail.tail.tail.tail.tail.tail.head === "s") {
      let rest = str.tail.tail.tail.tail.tail.tail.tail.tail;
      loop$str = rest;
      loop$acc = prepend(
        to_nibble(new NPlurals(), "nplurals", line, col),
        acc
      );
      loop$line = line;
      loop$col = col + 8;
    } else if (str.atLeastLength(6) && str.head === "p" && str.tail.head === "l" && str.tail.tail.head === "u" && str.tail.tail.tail.head === "r" && str.tail.tail.tail.tail.head === "a" && str.tail.tail.tail.tail.tail.head === "l") {
      let rest = str.tail.tail.tail.tail.tail.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new Plural2(), "plural", line, col), acc);
      loop$line = line;
      loop$col = col + 6;
    } else if (str.atLeastLength(1) && str.head === "n") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new N2(), "n", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(2) && str.head === "\\" && str.tail.head === "\n") {
      let rest = str.tail.tail;
      loop$str = rest;
      loop$acc = acc;
      loop$line = line + 1;
      loop$col = 1;
    } else if (str.atLeastLength(1) && str.head === "\n") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = acc;
      loop$line = line + 1;
      loop$col = 1;
    } else if (str.atLeastLength(1) && str.head === " ") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = acc;
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(2) && str.head === "=" && str.tail.head === "=") {
      let rest = str.tail.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new Equals(), "==", line, col), acc);
      loop$line = line;
      loop$col = col + 2;
    } else if (str.atLeastLength(2) && str.head === "!" && str.tail.head === "=") {
      let rest = str.tail.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new NotEquals(), "!=", line, col), acc);
      loop$line = line;
      loop$col = col + 2;
    } else if (str.atLeastLength(2) && str.head === ">" && str.tail.head === "=") {
      let rest = str.tail.tail;
      loop$str = rest;
      loop$acc = prepend(
        to_nibble(new GreaterThanOrEquals(), ">=", line, col),
        acc
      );
      loop$line = line;
      loop$col = col + 2;
    } else if (str.atLeastLength(2) && str.head === "<" && str.tail.head === "=") {
      let rest = str.tail.tail;
      loop$str = rest;
      loop$acc = prepend(
        to_nibble(new LowerThanOrEquals(), "<=", line, col),
        acc
      );
      loop$line = line;
      loop$col = col + 2;
    } else if (str.atLeastLength(1) && str.head === ">") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new GreaterThan2(), ">", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && str.head === "<") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new LowerThan2(), "<", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && str.head === "=") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new Assignment(), "=", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && str.head === "?") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new Ternary(), "?", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && str.head === ":") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new TernaryElse(), ":", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && str.head === "%") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new Remainder2(), "%", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(2) && str.head === "|" && str.tail.head === "|") {
      let rest = str.tail.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new Or2(), "||", line, col), acc);
      loop$line = line;
      loop$col = col + 2;
    } else if (str.atLeastLength(2) && str.head === "&" && str.tail.head === "&") {
      let rest = str.tail.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new And2(), "&&", line, col), acc);
      loop$line = line;
      loop$col = col + 2;
    } else if (str.atLeastLength(1) && str.head === ";") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new Semicolon(), ";", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && str.head === ")") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new RParen(), ")", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && str.head === "(") {
      let rest = str.tail;
      loop$str = rest;
      loop$acc = prepend(to_nibble(new LParen(), "(", line, col), acc);
      loop$line = line;
      loop$col = col + 1;
    } else if (str.atLeastLength(1) && (str.head === "0" || str.head === "1" || str.head === "2" || str.head === "3" || str.head === "4" || str.head === "5" || str.head === "6" || str.head === "7" || str.head === "8" || str.head === "9")) {
      let digit = str.head;
      let rest = str.tail;
      return read_digits(rest, acc, line, col + 1, digit);
    } else {
      let grapheme = str.head;
      return new Error(
        new SyntaxError(
          line,
          new Some(col),
          "Unexpected grapheme " + grapheme
        )
      );
    }
  }
}
function tokenize(str) {
  return do_tokenize(graphemes(str), toList([]), 1, 1);
}

// build/dev/javascript/kielet/kielet/plurals/parser.mjs
function int_parser() {
  return take_map(
    "An integer",
    (tok) => {
      if (tok instanceof Int) {
        let i = tok.value;
        return new Some(new Integer(i));
      } else {
        return new None();
      }
    }
  );
}
function n_parser() {
  return take_map(
    "n",
    (tok) => {
      if (tok instanceof N2) {
        return new Some(new N());
      } else {
        return new None();
      }
    }
  );
}
function lparen_parser() {
  return take_map(
    "Left parenthesis",
    (tok) => {
      if (tok instanceof LParen) {
        return new Some(void 0);
      } else {
        return new None();
      }
    }
  );
}
function rparen_parser() {
  return take_map(
    "Right parenthesis",
    (tok) => {
      if (tok instanceof RParen) {
        return new Some(void 0);
      } else {
        return new None();
      }
    }
  );
}
function paren_parser() {
  return do$(
    lparen_parser(),
    (_) => {
      return do$(
        plurals_parser(),
        (expr) => {
          return do$(
            rparen_parser(),
            (_2) => {
              return return$(new Paren(expr));
            }
          );
        }
      );
    }
  );
}
function plurals_parser() {
  return do$(
    expr_parser(),
    (maybe_cond) => {
      return one_of(
        toList([rest_of_ternary_parser(maybe_cond), return$(maybe_cond)])
      );
    }
  );
}
function expr_parser() {
  return expression(
    toList([
      (_) => {
        return int_parser();
      },
      (_) => {
        return n_parser();
      },
      (_) => {
        return paren_parser();
      }
    ]),
    toList([
      infix_left(
        200,
        token(new And2()),
        (l, r) => {
          return new BinaryOperation(new And(), l, r);
        }
      ),
      infix_left(
        200,
        token(new Or2()),
        (l, r) => {
          return new BinaryOperation(new Or(), l, r);
        }
      ),
      infix_left(
        300,
        token(new Equals()),
        (l, r) => {
          return new BinaryOperation(new Equal(), l, r);
        }
      ),
      infix_left(
        300,
        token(new NotEquals()),
        (l, r) => {
          return new BinaryOperation(new NotEqual(), l, r);
        }
      ),
      infix_left(
        300,
        token(new GreaterThan2()),
        (l, r) => {
          return new BinaryOperation(new GreaterThan(), l, r);
        }
      ),
      infix_left(
        300,
        token(new LowerThan2()),
        (l, r) => {
          return new BinaryOperation(new LowerThan(), l, r);
        }
      ),
      infix_left(
        300,
        token(new GreaterThanOrEquals()),
        (l, r) => {
          return new BinaryOperation(new GreaterThanOrEqual(), l, r);
        }
      ),
      infix_left(
        300,
        token(new LowerThanOrEquals()),
        (l, r) => {
          return new BinaryOperation(new LowerThanOrEqual(), l, r);
        }
      ),
      infix_right(
        400,
        token(new Remainder2()),
        (l, r) => {
          return new BinaryOperation(new Remainder(), l, r);
        }
      )
    ]),
    return$(void 0)
  );
}
function main_parser() {
  return do$(
    token(new NPlurals()),
    (_) => {
      return do$(
        token(new Assignment()),
        (_2) => {
          return do$(
            int_parser(),
            (nplurals) => {
              return do$(
                token(new Semicolon()),
                (_3) => {
                  return do$(
                    token(new Plural2()),
                    (_4) => {
                      return do$(
                        token(new Assignment()),
                        (_5) => {
                          return do$(
                            plurals_parser(),
                            (ast) => {
                              return do$(
                                optional(
                                  token(new Semicolon())
                                ),
                                (_6) => {
                                  return do$(
                                    token(new End()),
                                    (_7) => {
                                      return do$(
                                        eof(),
                                        (_8) => {
                                          if (!(nplurals instanceof Integer)) {
                                            throw makeError(
                                              "let_assert",
                                              "kielet/plurals/parser",
                                              29,
                                              "",
                                              "Pattern match failed, no pattern matched the value.",
                                              { value: nplurals }
                                            );
                                          }
                                          let nplurals$1 = nplurals[0];
                                          return return$(
                                            [nplurals$1, ast]
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function parse4(input) {
  return run(input, main_parser());
}
function rest_of_ternary_parser(cond) {
  return do$(
    token(new Ternary()),
    (_) => {
      return do$(
        plurals_parser(),
        (if_true) => {
          return do$(
            token(new TernaryElse()),
            (_2) => {
              return do$(
                plurals_parser(),
                (if_false) => {
                  return return$(new If(cond, if_true, if_false));
                }
              );
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/kielet/kielet/plurals.mjs
var TokenizerError = class extends CustomType {
  constructor(err) {
    super();
    this.err = err;
  }
};
var ParserError = class extends CustomType {
  constructor(err) {
    super();
    this.err = err;
  }
};
var ParsingFailed = class extends CustomType {
  constructor(err) {
    super();
    this.err = err;
  }
};
var NoPluralFormsHeader = class extends CustomType {
};
var Plurals = class extends CustomType {
  constructor(total, algorithm) {
    super();
    this.total = total;
    this.algorithm = algorithm;
  }
};
function parse5(input) {
  return try$(
    (() => {
      let _pipe = tokenize(input);
      return map_error(
        _pipe,
        (var0) => {
          return new TokenizerError(var0);
        }
      );
    })(),
    (tokens) => {
      return try$(
        (() => {
          let _pipe = parse4(tokens);
          return map_error(
            _pipe,
            (var0) => {
              return new ParserError(var0);
            }
          );
        })(),
        (_use0) => {
          let total = _use0[0];
          let ast = _use0[1];
          return new Ok(new Plurals(total, ast));
        }
      );
    }
  );
}
var plural_forms_header = "Plural-Forms";
function load_from_mo(mo) {
  return try$(
    (() => {
      let _pipe = get(mo.metadata, plural_forms_header);
      return replace_error(_pipe, new NoPluralFormsHeader());
    })(),
    (plural_header) => {
      let _pipe = parse5(plural_header);
      return map_error(
        _pipe,
        (var0) => {
          return new ParsingFailed(var0);
        }
      );
    }
  );
}

// build/dev/javascript/kielet/kielet/language.mjs
var MoParseError = class extends CustomType {
  constructor(err) {
    super();
    this.err = err;
  }
};
var PluralFormsLoadError = class extends CustomType {
  constructor(err) {
    super();
    this.err = err;
  }
};
var MsgIsPlural = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var MsgNotFound = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Language = class extends CustomType {
  constructor(code, translations, plurals) {
    super();
    this.code = code;
    this.translations = translations;
    this.plurals = plurals;
  }
};
function load(code, mo_file) {
  return try$(
    (() => {
      let _pipe = parse2(mo_file);
      return map_error(
        _pipe,
        (var0) => {
          return new MoParseError(var0);
        }
      );
    })(),
    (mo) => {
      let $ = load_from_mo(mo);
      if ($.isOk()) {
        let p = $[0];
        return new Ok(new Language(code, mo.translations, new Some(p)));
      } else if (!$.isOk() && $[0] instanceof NoPluralFormsHeader) {
        return new Ok(new Language(code, mo.translations, new None()));
      } else {
        let err = $[0];
        return new Error(new PluralFormsLoadError(err));
      }
    }
  );
}
function get_code(lang) {
  return lang.code;
}
function form_key(context, msgid) {
  if (context instanceof Some) {
    let context$1 = context[0];
    return new WithContext(context$1, msgid);
  } else {
    return new NoContext(msgid);
  }
}
function get_singular_translation(lang, context, msgid) {
  let $ = get(lang.translations, form_key(context, msgid));
  if ($.isOk()) {
    let mostring = $[0];
    if (mostring instanceof Singular) {
      let content = mostring.content;
      return new Ok(content);
    } else {
      return new Error(new MsgIsPlural(msgid));
    }
  } else {
    return new Error(new MsgNotFound(msgid));
  }
}

// build/dev/javascript/kielet/kielet/database.mjs
var Database = class extends CustomType {
  constructor(languages) {
    super();
    this.languages = languages;
  }
};
function new$3() {
  return new Database(new$());
}
function add_language(db, lang) {
  return new Database(
    insert(db.languages, get_code(lang), lang)
  );
}
function translate_singular(db, context, msgid, language_code) {
  let $ = get(db.languages, language_code);
  if ($.isOk()) {
    let lang = $[0];
    let $1 = get_singular_translation(lang, context, msgid);
    if ($1.isOk()) {
      let translation = $1[0];
      return translation;
    } else {
      return msgid;
    }
  } else {
    return msgid;
  }
}

// build/dev/javascript/kielet/kielet/context.mjs
var Context = class extends CustomType {
  constructor(database, language) {
    super();
    this.database = database;
    this.language = language;
  }
};

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key2, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key2;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Fragment = class extends CustomType {
  constructor(elements2, key2) {
    super();
    this.elements = elements2;
    this.key = key2;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_left(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key2) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index3) => {
      let key$1 = key2 + "-" + to_string2(index3);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key2 = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key2;
    } else if (element2 instanceof Element) {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key2 + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key2);
    } else {
      let elements2 = element2.elements;
      return do_element_list_handlers(elements2, handlers2, key2);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new$(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value2) {
  return new Attribute(name, identity(value2), false);
}
function on(name, handler) {
  return new Event2("on" + name, handler);
}
function map6(attr, f) {
  if (attr instanceof Attribute) {
    let name$1 = attr[0];
    let value$1 = attr[1];
    let as_property = attr.as_property;
    return new Attribute(name$1, value$1, as_property);
  } else {
    let on$1 = attr[0];
    let handler = attr[1];
    return new Event2(on$1, (e) => {
      return map2(handler(e), f);
    });
  }
}
function class$(name) {
  return attribute("class", name);
}
function id(name) {
  return attribute("id", name);
}
function title(name) {
  return attribute("title", name);
}
function src(uri) {
  return attribute("src", uri);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag, attrs, children2, false, false);
  }
}
function text(content) {
  return new Text(content);
}
function map7(element2, f) {
  if (element2 instanceof Text) {
    let content = element2.content;
    return new Text(content);
  } else if (element2 instanceof Map2) {
    let subtree = element2.subtree;
    return new Map2(() => {
      return map7(subtree(), f);
    });
  } else if (element2 instanceof Element) {
    let key2 = element2.key;
    let namespace = element2.namespace;
    let tag = element2.tag;
    let attrs = element2.attrs;
    let children2 = element2.children;
    let self_closing = element2.self_closing;
    let void$ = element2.void;
    return new Map2(
      () => {
        return new Element(
          key2,
          namespace,
          tag,
          map(
            attrs,
            (_capture) => {
              return map6(_capture, f);
            }
          ),
          map(children2, (_capture) => {
            return map7(_capture, f);
          }),
          self_closing,
          void$
        );
      }
    );
  } else {
    let elements2 = element2.elements;
    let key2 = element2.key;
    return new Map2(
      () => {
        return new Fragment(
          map(elements2, (_capture) => {
            return map7(_capture, f);
          }),
          key2
        );
      }
    );
  }
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new$()) && isEqual(
    diff2.removed,
    new$2()
  ) && isEqual(diff2.updated, new$());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event3 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
function morph(prev, next2, dispatch) {
  let out;
  let stack = [{ prev, next: next2, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next3, parent } = stack.pop();
    while (next3.subtree !== void 0)
      next3 = next3.subtree();
    if (next3.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next3.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next3.content)
          prev2.textContent = next3.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next3.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next3.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next3,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    } else if (next3.elements !== void 0) {
      for (const fragmentElement of forceChild(next3)) {
        stack.unshift({ prev: prev2, next: fragmentElement, parent });
        prev2 = prev2?.nextSibling;
      }
    }
  }
  return out;
}
function createElementNode({ prev, next: next2, dispatch, stack }) {
  const namespace = next2.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next2.tag && prev.namespaceURI === (next2.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next2.tag) : document.createElement(next2.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a) => a.name)) : null;
  let className = null;
  let style = null;
  let innerHTML = null;
  if (canMorph && next2.tag === "textarea") {
    const innertText = next2.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next2.attrs) {
    const name = attr[0];
    const value2 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value2)
        el[name] = value2;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value2, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value2);
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value2);
      delegated.push([name.slice(10), value2]);
    } else if (name === "class") {
      className = className === null ? value2 : className + " " + value2;
    } else if (name === "style") {
      style = style === null ? value2 : style + value2;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value2;
    } else {
      if (el.getAttribute(name) !== value2)
        el.setAttribute(name, value2);
      if (name === "value" || name === "selected")
        el[name] = value2;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style !== null) {
    el.setAttribute("style", style);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next2.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value2] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value2);
          }
        }
      }
    });
  }
  if (next2.key !== void 0 && next2.key !== "") {
    el.setAttribute("data-lustre-key", next2.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next2).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next2);
    for (const child of children(next2)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next2)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next3 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next3;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target2 = event2.currentTarget;
  if (!registeredHandlers.has(target2)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target2);
  if (!handlersForEventTarget.has(event2.type)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property) => {
        const path2 = property.split(".");
        for (let i = 0, o = data2, e = event2; i < path2.length; i++) {
          if (i === path2.length - 1) {
            o[path2[i]] = e[path2[i]];
          } else {
            o[path2[i]] ??= {};
            e = e[path2[i]];
            o = o[path2[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key2 = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key2)
        keyedChildren.set(key2, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el.insertBefore(placeholder, prevChild);
    stack.unshift({ prev: placeholder, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.elements !== void 0) {
    for (const inner of element2.elements) {
      yield* forceChild(inner);
    }
  } else if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init3, update: update5, view: view4 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init3(flags), update5, view4);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init3, effects], update5, view4) {
    this.root = root;
    this.#model = init3;
    this.#update = update5;
    this.#view = view4;
    this.#tickScheduled = window.requestAnimationFrame(
      () => this.#tick(effects.all.toArray(), true)
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.requestAnimationFrame(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   * @param {boolean} isFirstRender
   */
  #tick(effects = [], isFirstRender = false) {
    this.#tickScheduled = void 0;
    if (!this.#flush(effects, isFirstRender))
      return;
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = [], didUpdate = false) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next2, effect] = this.#update(this.#model, msg);
      didUpdate ||= this.#model !== next2;
      effects = effects.concat(effect.all.toArray());
      this.#model = next2;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      effect({ dispatch, emit: emit2, select });
    }
    if (this.#queue.length > 0) {
      return this.#flush(effects, didUpdate);
    } else {
      return didUpdate;
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init3, update: update5, view: view4, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init3(flags),
      update5,
      view4,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update5, view4, on_attribute_change) {
    this.#model = model;
    this.#update = update5;
    this.#view = view4;
    this.#html = view4(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event3) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    if (!this.#flush(false, effects))
      return;
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(didUpdate = false, effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next2, effect] = this.#update(this.#model, msg);
      didUpdate ||= this.#model !== next2;
      effects = effects.concat(effect.all.toArray());
      this.#model = next2;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      effect({ dispatch, emit: emit2, select });
    }
    if (this.#queue.length > 0) {
      return this.#flush(didUpdate, effects);
    } else {
      return didUpdate;
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update5, view4, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update5;
    this.view = view4;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update5, view4) {
  return new App(init3, update5, view4, new None());
}
function simple(init3, update5, view4) {
  let init$1 = (flags) => {
    return [init3(flags), none()];
  };
  let update$1 = (model, msg) => {
    return [update5(model, msg), none()];
  };
  return application(init$1, update$1, view4);
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function span(attrs, children2) {
  return element("span", attrs, children2);
}
function img(attrs) {
  return element("img", attrs, toList([]));
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}
function textarea(attrs, content) {
  return element("textarea", attrs, toList([text(content)]));
}

// build/dev/javascript/simplifile/simplifile_js.mjs
import fs from "node:fs";
import path from "node:path";
import process2 from "node:process";
function readBits(filepath) {
  return gleamResult(() => {
    const contents = fs.readFileSync(path.normalize(filepath));
    return new BitArray(new Uint8Array(contents));
  });
}
function gleamResult(op) {
  try {
    const val = op();
    return new Ok(val);
  } catch (e) {
    return new Error(cast_error(e.code));
  }
}
function cast_error(error_code) {
  switch (error_code) {
    case "EACCES":
      return new Eacces();
    case "EAGAIN":
      return new Eagain();
    case "EBADF":
      return new Ebadf();
    case "EBADMSG":
      return new Ebadmsg();
    case "EBUSY":
      return new Ebusy();
    case "EDEADLK":
      return new Edeadlk();
    case "EDEADLOCK":
      return new Edeadlock();
    case "EDQUOT":
      return new Edquot();
    case "EEXIST":
      return new Eexist();
    case "EFAULT":
      return new Efault();
    case "EFBIG":
      return new Efbig();
    case "EFTYPE":
      return new Eftype();
    case "EINTR":
      return new Eintr();
    case "EINVAL":
      return new Einval();
    case "EIO":
      return new Eio();
    case "EISDIR":
      return new Eisdir();
    case "ELOOP":
      return new Eloop();
    case "EMFILE":
      return new Emfile();
    case "EMLINK":
      return new Emlink();
    case "EMULTIHOP":
      return new Emultihop();
    case "ENAMETOOLONG":
      return new Enametoolong();
    case "ENFILE":
      return new Enfile();
    case "ENOBUFS":
      return new Enobufs();
    case "ENODEV":
      return new Enodev();
    case "ENOLCK":
      return new Enolck();
    case "ENOLINK":
      return new Enolink();
    case "ENOENT":
      return new Enoent();
    case "ENOMEM":
      return new Enomem();
    case "ENOSPC":
      return new Enospc();
    case "ENOSR":
      return new Enosr();
    case "ENOSTR":
      return new Enostr();
    case "ENOSYS":
      return new Enosys();
    case "ENOBLK":
      return new Enotblk();
    case "ENODIR":
      return new Enotdir();
    case "ENOTSUP":
      return new Enotsup();
    case "ENXIO":
      return new Enxio();
    case "EOPNOTSUPP":
      return new Eopnotsupp();
    case "EOVERFLOW":
      return new Eoverflow();
    case "EPERM":
      return new Eperm();
    case "EPIPE":
      return new Epipe();
    case "ERANGE":
      return new Erange();
    case "EROFS":
      return new Erofs();
    case "ESPIPE":
      return new Espipe();
    case "ESRCH":
      return new Esrch();
    case "ESTALE":
      return new Estale();
    case "ETXTBSY":
      return new Etxtbsy();
    case "EXDEV":
      return new Exdev();
    case "NOTUTF8":
      return new NotUtf8();
    default:
      return new Unknown(error_code);
  }
}

// build/dev/javascript/simplifile/simplifile.mjs
var Eacces = class extends CustomType {
};
var Eagain = class extends CustomType {
};
var Ebadf = class extends CustomType {
};
var Ebadmsg = class extends CustomType {
};
var Ebusy = class extends CustomType {
};
var Edeadlk = class extends CustomType {
};
var Edeadlock = class extends CustomType {
};
var Edquot = class extends CustomType {
};
var Eexist = class extends CustomType {
};
var Efault = class extends CustomType {
};
var Efbig = class extends CustomType {
};
var Eftype = class extends CustomType {
};
var Eintr = class extends CustomType {
};
var Einval = class extends CustomType {
};
var Eio = class extends CustomType {
};
var Eisdir = class extends CustomType {
};
var Eloop = class extends CustomType {
};
var Emfile = class extends CustomType {
};
var Emlink = class extends CustomType {
};
var Emultihop = class extends CustomType {
};
var Enametoolong = class extends CustomType {
};
var Enfile = class extends CustomType {
};
var Enobufs = class extends CustomType {
};
var Enodev = class extends CustomType {
};
var Enolck = class extends CustomType {
};
var Enolink = class extends CustomType {
};
var Enoent = class extends CustomType {
};
var Enomem = class extends CustomType {
};
var Enospc = class extends CustomType {
};
var Enosr = class extends CustomType {
};
var Enostr = class extends CustomType {
};
var Enosys = class extends CustomType {
};
var Enotblk = class extends CustomType {
};
var Enotdir = class extends CustomType {
};
var Enotsup = class extends CustomType {
};
var Enxio = class extends CustomType {
};
var Eopnotsupp = class extends CustomType {
};
var Eoverflow = class extends CustomType {
};
var Eperm = class extends CustomType {
};
var Epipe = class extends CustomType {
};
var Erange = class extends CustomType {
};
var Erofs = class extends CustomType {
};
var Espipe = class extends CustomType {
};
var Esrch = class extends CustomType {
};
var Estale = class extends CustomType {
};
var Etxtbsy = class extends CustomType {
};
var Exdev = class extends CustomType {
};
var NotUtf8 = class extends CustomType {
};
var Unknown = class extends CustomType {
  constructor(inner) {
    super();
    this.inner = inner;
  }
};

// build/dev/javascript/app/storage/constants.mjs
var left = "left-list";
var right = "right-list";
var only_left = "only-left-list";
var only_right = "only-right-list";
var contain_both = "contain-both-list";

// build/dev/javascript/kielet/kielet.mjs
function gettext(context, msgid) {
  return translate_singular(
    context.database,
    new None(),
    msgid,
    context.language
  );
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function value(event2) {
  let _pipe = event2;
  return field("target", field("value", string2))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value(event2);
      return map2(_pipe, msg);
    }
  );
}

// build/dev/javascript/app/views/compare_button.mjs
var UserCompareListContents = class extends CustomType {
};
function update(model, msg) {
  {
    let $ = get(model, left);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "views/compare_button",
        18,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let left_list = $[0];
    let $1 = get(model, right);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "views/compare_button",
        19,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let right_list = $1[0];
    let only_left_list = filter(
      left_list,
      (x) => {
        return !contains(right_list, x);
      }
    );
    let only_right_list = filter(
      right_list,
      (x) => {
        return !contains(left_list, x);
      }
    );
    let both_list = (() => {
      let _pipe = concat(toList([left_list, right_list]));
      let _pipe$1 = filter(
        _pipe,
        (x) => {
          return !contains(only_left_list, x) && !contains(
            only_right_list,
            x
          );
        }
      );
      return unique(_pipe$1);
    })();
    return from_list(
      toList([
        [left, left_list],
        [right, right_list],
        [only_left, only_left_list],
        [only_right, only_right_list],
        [contain_both, both_list]
      ])
    );
  }
}
function view(ctx) {
  let style = "rounded-md text-indigo-600 border-2 border-indigo-600 p-4 bg-transparent hover:text-white hover:bg-indigo-600 transition delay-75 duration-300";
  return button(
    toList([
      id("compare-button"),
      class$(style),
      on_click(new UserCompareListContents())
    ]),
    toList([text(gettext(ctx, "Compare"))])
  );
}

// build/dev/javascript/app/views/switch_button.mjs
var UserSwitchListContents = class extends CustomType {
};
function update2(model, msg) {
  {
    let $ = get(model, left);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "views/switch_button",
        14,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let left_list = $[0];
    let $1 = get(model, right);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "views/switch_button",
        15,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let right_list = $1[0];
    let $2 = get(model, only_left);
    if (!$2.isOk()) {
      throw makeError(
        "let_assert",
        "views/switch_button",
        17,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $2 }
      );
    }
    let only_left_list = $2[0];
    let $3 = get(model, only_right);
    if (!$3.isOk()) {
      throw makeError(
        "let_assert",
        "views/switch_button",
        18,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $3 }
      );
    }
    let only_right_list = $3[0];
    return merge(
      model,
      from_list(
        toList([
          [left, right_list],
          [right, left_list],
          [only_left, only_right_list],
          [only_right, only_left_list]
        ])
      )
    );
  }
}
function view2() {
  let style = "p-4 bg-slate-400 items-center self-center w-12 hover:bg-slate-200 transition delay-75 duration-300 ease-in-out";
  return button(
    toList([
      id("switch-list-content"),
      class$(style),
      on_click(new UserSwitchListContents())
    ]),
    toList([
      img(
        toList([
          src("/priv/static/images/switch.svg"),
          class$("w-5")
        ])
      )
    ])
  );
}

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value2) {
    return value2 instanceof Promise ? new _PromiseLayer(value2) : value2;
  }
  static unwrap(value2) {
    return value2 instanceof _PromiseLayer ? value2.promise : value2;
  }
};
function newPromise(executor) {
  return new Promise(
    (resolve2) => executor((value2) => {
      resolve2(PromiseLayer.wrap(value2));
    })
  );
}
function then_await(promise, fn) {
  return promise.then((value2) => fn(PromiseLayer.unwrap(value2)));
}

// build/dev/javascript/plinth/clipboard_ffi.mjs
async function writeText(clipText) {
  try {
    return new Ok(await window.navigator.clipboard.writeText(clipText));
  } catch (error) {
    return new Error(error.toString());
  }
}

// build/dev/javascript/plinth/window_ffi.mjs
function self() {
  return globalThis;
}
function alert(message) {
  window.alert(message);
}
function prompt(message, defaultValue) {
  let text2 = window.prompt(message, defaultValue);
  if (text2 !== null) {
    return new Ok(text2);
  } else {
    return new Error();
  }
}
function addEventListener(type, listener) {
  return window.addEventListener(type, listener);
}
async function requestWakeLock() {
  try {
    return new Ok(await window.navigator.wakeLock.request("screen"));
  } catch (error) {
    return new Error(error.toString());
  }
}
function location() {
  return window.location.href;
}
function locationOf(w) {
  try {
    return new Ok(w.location.href);
  } catch (error) {
    return new Error(error.toString());
  }
}
function setLocation(w, url) {
  w.location.href = url;
}
function origin() {
  return window.location.origin;
}
function pathname() {
  return window.location.pathname;
}
function reload() {
  return window.location.reload();
}
function reloadOf(w) {
  return w.location.reload();
}
function focus(w) {
  return w.focus();
}
function getHash2() {
  const hash = window.location.hash;
  if (hash == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(hash.slice(1)));
}
function getSearch() {
  const search = window.location.search;
  if (search == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(search.slice(1)));
}
function innerHeight(w) {
  return w.innerHeight;
}
function innerWidth(w) {
  return w.innerWidth;
}
function outerHeight(w) {
  return w.outerHeight;
}
function outerWidth(w) {
  return w.outerWidth;
}
function screenX(w) {
  return w.screenX;
}
function screenY(w) {
  return w.screenY;
}
function screenTop(w) {
  return w.screenTop;
}
function screenLeft(w) {
  return w.screenLeft;
}
function scrollX(w) {
  return w.scrollX;
}
function scrollY(w) {
  return w.scrollY;
}
function open(url, target2, features) {
  try {
    return new Ok(window.open(url, target2, features));
  } catch (error) {
    return new Error(error.toString());
  }
}
function close(w) {
  w.close();
}
function closed(w) {
  return w.closed;
}
function queueMicrotask(callback) {
  return window.queueMicrotask(callback);
}
function requestAnimationFrame(callback) {
  return window.requestAnimationFrame(callback);
}
function cancelAnimationFrame(callback) {
  return window.cancelAnimationFrame(callback);
}
function eval_(string) {
  try {
    return new Ok(eval(string));
  } catch (error) {
    return new Error(error.toString());
  }
}
async function import_(string4) {
  try {
    return new Ok(await import(string4));
  } catch (error) {
    return new Error(error.toString());
  }
}

// build/dev/javascript/app/string/lines.mjs
function text_to_lines(value2) {
  let lines = split3(value2, "\n");
  let line_breaks = (() => {
    let _pipe2 = range2(0, length(lines) - 1);
    let _pipe$1 = filter2(_pipe2, (x) => {
      return x > 0;
    });
    return map3(_pipe$1, (_) => {
      return "\n";
    });
  })();
  let _pipe = index_map(
    lines,
    (v, k) => {
      let $ = at(line_breaks, k);
      if ($.isOk()) {
        return v + "\n";
      } else {
        return v;
      }
    }
  );
  return filter(_pipe, (x) => {
    return x !== "";
  });
}
function count_text_lines(value2) {
  let _pipe = filter(value2, (x) => {
    return x !== "";
  });
  let _pipe$1 = filter(_pipe, (x) => {
    return x !== "\n";
  });
  return length(_pipe$1);
}

// build/dev/javascript/app/views/text_view.mjs
var UserListTyping = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var UserTrimListSpaces = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserSortList = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserCopyList = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserDeletedList = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function clipboard(data) {
  return then_await(
    writeText(data),
    (result) => {
      if (result.isOk()) {
        return newPromise(
          (_) => {
            alert("Copiado para \xE1rea de transfer\xEAncia.");
            return void 0;
          }
        );
      } else {
        return newPromise(
          (_) => {
            alert("Falha ao copiar lista para \xE1rea de transfer\xEAncia");
            return void 0;
          }
        );
      }
    }
  );
}
function update3(model, msg) {
  if (msg instanceof UserListTyping) {
    let name = msg[0];
    let content = msg[1];
    return merge(
      model,
      from_list(toList([[name, text_to_lines(content)]]))
    );
  } else if (msg instanceof UserTrimListSpaces) {
    let name = msg[0];
    let trim3 = (x) => {
      if (x instanceof Some) {
        let current_list = x[0];
        return filter(
          current_list,
          (e) => {
            return e !== "" && e !== "\n";
          }
        );
      } else {
        return toList([]);
      }
    };
    return upsert(model, name, trim3);
  } else if (msg instanceof UserSortList) {
    let name = msg[0];
    let sort2 = (x) => {
      if (x instanceof Some) {
        let current_list = x[0];
        return sort(current_list, compare3);
      } else {
        return toList([]);
      }
    };
    return upsert(model, name, sort2);
  } else if (msg instanceof UserDeletedList) {
    let name = msg[0];
    return merge(model, from_list(toList([[name, toList([])]])));
  } else {
    let data = msg[0];
    clipboard(data);
    return model;
  }
}
function text_counter(name, count) {
  let zero_counter_style = "flex flex-row  text-slate-200 z-10 relative mt-[-1.75rem] mr-4 justify-end";
  let counter_style = "flex flex-row text-black z-10 relative mt-[-1.75rem] mr-4 justify-end";
  return span(
    toList([
      id(name),
      (() => {
        let $ = count === "0";
        if ($) {
          return class$(zero_counter_style);
        } else {
          return class$(counter_style);
        }
      })()
    ]),
    toList([text(count)])
  );
}
function action_button(name, title2, img2, msg) {
  let style = "items-center self-center hover:filter hover:invert transition delay-100 duration-300";
  return button(
    toList([
      id(name),
      title(title2),
      class$(style),
      on_click(msg)
    ]),
    toList([img(toList([src(img2), class$("w-6")]))])
  );
}
function text_area(name, content) {
  let text2 = join2(content, "");
  let count = (() => {
    let _pipe = count_text_lines(content);
    return to_string2(_pipe);
  })();
  let text_area_style = "w-80 lg:w-[540px] 2xl:w-[720px] h-48 lg:h-96 p-2 outline-none bg-white border-2 border-slate-200";
  let action_buttons_style = "flex flex-row items-center gap-4 bg-slate-100 p-4 shadow-md";
  return div(
    toList([id(name)]),
    toList([
      div(
        toList([]),
        toList([
          textarea(
            toList([
              id(name),
              class$(text_area_style),
              on_input(
                (value2) => {
                  return new UserListTyping(name, value2);
                }
              )
            ]),
            text2
          ),
          text_counter("counter-" + name, count)
        ])
      ),
      div(
        toList([
          id("actions-" + name),
          class$(action_buttons_style)
        ]),
        toList([
          action_button(
            "trim-" + name,
            "Remover espa\xE7os em branco",
            "/priv/static/images/trim.svg",
            new UserTrimListSpaces(name)
          ),
          action_button(
            "sort-" + name,
            "Ordernar lista",
            "/priv/static/images/sort-asc.svg",
            new UserSortList(name)
          ),
          action_button(
            "copy-" + name,
            "Copiar para \xE1rea de transfer\xEAncia",
            "/priv/static/images/copy.svg",
            new UserCopyList(join2(content, ""))
          ),
          action_button(
            "delete-" + name,
            "Apagar conte\xFAdo",
            "/priv/static/images/delete.svg",
            new UserDeletedList(name)
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/app/app.mjs
var Model2 = class extends CustomType {
  constructor(lists, ctx) {
    super();
    this.lists = lists;
    this.ctx = ctx;
  }
};
var TextViewMsg = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var SwitchViewMsg = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var CompareViewMsg = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function init2(_) {
  let $ = readBits("./translations/pt-br.mo");
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      32,
      "init",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let mo_data = $[0];
  let $1 = load("pt_BR", mo_data);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      33,
      "init",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let portuguese = $1[0];
  let db = (() => {
    let _pipe = new$3();
    return add_language(_pipe, portuguese);
  })();
  let ctx = new Context(db, "pt_BR");
  return new Model2(
    from_list(
      toList([
        [left, toList([])],
        [right, toList([])],
        [only_left, toList([])],
        [only_right, toList([])],
        [contain_both, toList([])]
      ])
    ),
    ctx
  );
}
function update4(model, msg) {
  if (msg instanceof TextViewMsg) {
    let msg$1 = msg[0];
    return model.withFields({ lists: update3(model.lists, msg$1) });
  } else if (msg instanceof SwitchViewMsg) {
    let msg$1 = msg[0];
    return model.withFields({ lists: update2(model.lists, msg$1) });
  } else {
    let msg$1 = msg[0];
    return model.withFields({ lists: update(model.lists, msg$1) });
  }
}
function view3(model) {
  let $ = get(model.lists, left);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      62,
      "view",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let left_list = $[0];
  let $1 = get(model.lists, right);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      63,
      "view",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let right_list = $1[0];
  let $2 = get(model.lists, only_left);
  if (!$2.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      65,
      "view",
      "Pattern match failed, no pattern matched the value.",
      { value: $2 }
    );
  }
  let only_left_list = $2[0];
  let $3 = get(model.lists, only_right);
  if (!$3.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      66,
      "view",
      "Pattern match failed, no pattern matched the value.",
      { value: $3 }
    );
  }
  let only_right_list = $3[0];
  let $4 = get(model.lists, contain_both);
  if (!$4.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      68,
      "view",
      "Pattern match failed, no pattern matched the value.",
      { value: $4 }
    );
  }
  let both_list = $4[0];
  let root_style = "flex flex-col px-4 py-16  m-auto gap-16 items-center";
  let view_list_style = "flex flex-col md:flex-row m-auto gap-4 px-4 items-center";
  return div(
    toList([id("root"), class$(root_style)]),
    toList([
      div(
        toList([id("view-lists"), class$(view_list_style)]),
        toList([
          map7(
            text_area(left, left_list),
            (a) => {
              return new TextViewMsg(a);
            }
          ),
          map7(
            view2(),
            (a) => {
              return new SwitchViewMsg(a);
            }
          ),
          map7(
            text_area(right, right_list),
            (a) => {
              return new TextViewMsg(a);
            }
          )
        ])
      ),
      map7(
        view(model.ctx),
        (a) => {
          return new CompareViewMsg(a);
        }
      ),
      div(
        toList([
          id("view-comparison-lists"),
          class$(view_list_style)
        ]),
        toList([
          map7(
            text_area(only_left, only_left_list),
            (a) => {
              return new TextViewMsg(a);
            }
          ),
          map7(
            text_area(only_right, only_right_list),
            (a) => {
              return new TextViewMsg(a);
            }
          )
        ])
      ),
      div(
        toList([
          id("view-both-lists"),
          class$(view_list_style)
        ]),
        toList([
          map7(
            text_area(contain_both, both_list),
            (a) => {
              return new TextViewMsg(a);
            }
          )
        ])
      )
    ])
  );
}
function main() {
  let app = simple(init2, update4, view3);
  let $ = start2(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      17,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
