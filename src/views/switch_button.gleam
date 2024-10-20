import gleam/dict
import lustre/attribute
import lustre/element/html
import lustre/event
import storage/constants

pub type SwitchListMsg {
  UserSwitchListContents
}

pub fn update(model: dict.Dict(String, List(String)), msg: SwitchListMsg) {
  case msg {
    UserSwitchListContents -> {
      let assert Ok(left_list) = dict.get(model, constants.left)
      let assert Ok(right_list) = dict.get(model, constants.right)

      let assert Ok(only_left_list) = dict.get(model, constants.only_left)
      let assert Ok(only_right_list) = dict.get(model, constants.only_right)

      dict.merge(
        model,
        dict.from_list([
          #(constants.left, right_list),
          #(constants.right, left_list),
          #(constants.only_left, only_right_list),
          #(constants.only_right, only_left_list),
        ]),
      )
    }
  }
}

pub fn view() {
  let style =
    "p-4 bg-slate-400 items-center self-center w-12"
    <> " hover:bg-slate-200 transition delay-75 duration-300 ease-in-out"

  html.button(
    [
      attribute.id("switch-list-content"),
      attribute.class(style),
      event.on_click(UserSwitchListContents),
    ],
    [
      html.img([
        attribute.src("/priv/static/images/switch.svg"),
        attribute.class("w-5"),
      ]),
    ],
  )
}
