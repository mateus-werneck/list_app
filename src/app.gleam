import gleam/dict
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import storage/constants
import views/compare_button
import views/switch_button
import views/text_view

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

pub type Model =
  dict.Dict(String, List(String))

pub type Msg {
  TextViewMsg(text_view.TextAreaMsg)
  SwitchViewMsg(switch_button.SwitchListMsg)
  CompareViewMsg(compare_button.CompareListMsg)
}

pub fn init(_flags) -> Model {
  dict.from_list([
    #(constants.left, []),
    #(constants.right, []),
    #(constants.only_left, []),
    #(constants.only_right, []),
    #(constants.contain_both, []),
  ])
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    TextViewMsg(msg) -> text_view.update(model, msg)
    SwitchViewMsg(msg) -> switch_button.update(model, msg)
    CompareViewMsg(msg) -> compare_button.update(model, msg)
  }
}

pub fn view(model: Model) -> element.Element(Msg) {
  let assert Ok(left_list) = dict.get(model, constants.left)
  let assert Ok(right_list) = dict.get(model, constants.right)

  let assert Ok(only_left_list) = dict.get(model, constants.only_left)
  let assert Ok(only_right_list) = dict.get(model, constants.only_right)

  let assert Ok(both_list) = dict.get(model, constants.contain_both)

  let root_style = "flex flex-col px-4 py-16 m-auto gap-16 items-center"

  let view_list_style =
    "flex flex-col xl:flex-row m-auto gap-4 px-4 items-center"

  html.div([attribute.id("root"), attribute.class(root_style)], [
    html.div([attribute.id("view-lists"), attribute.class(view_list_style)], [
      element.map(
        text_view.text_area(constants.left, left_list),
        fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
      ),
      element.map(switch_button.view(), fn(a: switch_button.SwitchListMsg) {
        SwitchViewMsg(a)
      }),
      element.map(
        text_view.text_area(constants.right, right_list),
        fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
      ),
    ]),
    element.map(compare_button.view(), fn(a: compare_button.CompareListMsg) {
      CompareViewMsg(a)
    }),
    html.div(
      [attribute.id("view-comparison-lists"), attribute.class(view_list_style)],
      [
        element.map(
          text_view.text_area(constants.only_left, only_left_list),
          fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
        ),
        element.map(
          text_view.text_area(constants.only_right, only_right_list),
          fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
        ),
      ],
    ),
    html.div(
      [attribute.id("view-both-lists"), attribute.class(view_list_style)],
      [
        element.map(
          text_view.text_area(constants.contain_both, both_list),
          fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
        ),
      ],
    ),
  ])
}
