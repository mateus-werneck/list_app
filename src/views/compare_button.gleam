import gleam/dict
import gleam/list
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import storage/constants

pub type CompareListMsg {
  UserCompareListContents
}

pub fn update(model: dict.Dict(String, List(string)), msg: CompareListMsg) {
  case msg {
    UserCompareListContents -> {
      let assert Ok(left_list) = dict.get(model, constants.left)
      let assert Ok(right_list) = dict.get(model, constants.right)

      let only_left_list =
        list.filter(left_list, fn(x) { !list.contains(right_list, x) })
      let only_right_list =
        list.filter(right_list, fn(x) { !list.contains(left_list, x) })

      let both_list =
        list.concat([left_list, right_list])
        |> list.filter(fn(x) {
          !list.contains(only_left_list, x)
          && !list.contains(only_right_list, x)
        })
        |> list.unique

      dict.from_list([
        #(constants.left, left_list),
        #(constants.right, right_list),
        #(constants.only_left, only_left_list),
        #(constants.only_right, only_right_list),
        #(constants.contain_both, both_list),
      ])
    }
  }
}

pub fn view() {
  let style =
    "rounded-md text-indigo-600 border-2 border-indigo-600 p-4 bg-transparent"
    <> " hover:text-white hover:bg-indigo-600 transition delay-75 duration-300"

  html.button(
    [
      attribute.id("compare-button"),
      attribute.class(style),
      event.on_click(UserCompareListContents),
    ],
    [element.text("Comparar")],
  )
}
