//// A module for treating string/text to lists

import gleam/iterator
import gleam/list
import gleam/string

/// Transform a string separated by new lines into a List(String)
///
/// The number of new lines are (n-1) the number of lines
///
/// ## Examples
///
/// ```gleam
/// text_to_lines("Hello\nWorld")
/// // -> ["Hello\n", "World"]
/// ```
///
/// ```gleam
/// text_to_lines("Hello")
/// // -> ["Hello"]
/// ```
///
/// ```gleam
/// text_to_lines("Hello\nWorld!\nBye")
/// // -> ["Hello\n", "World!\n", "Bye"]
/// ```
pub fn text_to_lines(value: String) -> List(String) {
  let lines = string.split(value, "\n")

  let line_breaks =
    iterator.range(0, list.length(lines) - 1)
    |> iterator.filter(fn(x) { x > 0 })
    |> iterator.map(fn(_) { "\n" })

  list.index_map(lines, fn(v, k) {
    case iterator.at(line_breaks, k) {
      Ok(_) -> v <> "\n"
      Error(_) -> v
    }
  })
  |> list.filter(fn(x) { x != "" })
}

/// Count number of valid lines inside a List(String)
///
/// Empty lines and strict new lines are ignored
///
/// ## Examples
///
/// ```gleam
/// count_text_lines(["\n", "\n"])
/// // -> 0
/// ```
///
/// ```gleam
/// count_text_lines(["", ""])
/// // -> 0
/// ```
///
/// ```gleam
/// count_text_lines(["Hello\n", "\n", ""])
/// // -> 1
/// ```
pub fn count_text_lines(value: List(String)) -> Int {
  list.filter(value, fn(x) { x != "" })
  |> list.filter(fn(x) { x != "\n" })
  |> list.length
}
