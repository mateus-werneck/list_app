import gleam/dict
import gleam/list
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import storage/constants
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
  UserCompareListContents
  TextViewMsg(text_view.TextAreaMsg)
  SwitchViewMsg(switch_button.SwitchListMsg)
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
    TextViewMsg(msg) -> text_view.update(model, msg)
    SwitchViewMsg(msg) -> switch_button.update(model, msg)
  }
}

pub fn view(model: Model) -> element.Element(Msg) {
  let assert Ok(left_list) = dict.get(model, constants.left)
  let assert Ok(right_list) = dict.get(model, constants.right)

  let assert Ok(only_left_list) = dict.get(model, constants.only_left)
  let assert Ok(only_right_list) = dict.get(model, constants.only_right)

  let assert Ok(both_list) = dict.get(model, constants.contain_both)

  let root_style = "flex flex-col px-4 py-16  m-auto gap-16 items-center"

  let view_list_style =
    "flex flex-col md:flex-row m-auto gap-4 px-4 items-center"

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
    compare_button(),
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

fn compare_button() {
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
