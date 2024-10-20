import gleam/dict
import gleam/list
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import views/text_view

pub const left: String = "left-list"

pub const right: String = "right-list"

pub const only_left: String = "only-left-list"

pub const only_right: String = "only-right-list"

pub const contain_both: String = "contain-both-list"

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

pub type Model =
  dict.Dict(String, List(String))

pub type Msg {
  UserSwitchListContents
  UserCompareListContents
  TextViewMsg(text_view.TextAreaMsg)
}

pub fn init(_flags) -> Model {
  dict.from_list([
    #(left, []),
    #(right, []),
    #(only_left, []),
    #(only_right, []),
    #(contain_both, []),
  ])
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserSwitchListContents -> {
      let assert Ok(left_list) = dict.get(model, left)
      let assert Ok(right_list) = dict.get(model, right)

      let assert Ok(only_left_list) = dict.get(model, only_left)
      let assert Ok(only_right_list) = dict.get(model, only_right)

      dict.merge(
        model,
        dict.from_list([
          #(left, right_list),
          #(right, left_list),
          #(only_left, only_right_list),
          #(only_right, only_left_list),
        ]),
      )
    }

    UserCompareListContents -> {
      let assert Ok(left_list) = dict.get(model, left)
      let assert Ok(right_list) = dict.get(model, right)

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
        #(left, left_list),
        #(right, right_list),
        #(only_left, only_left_list),
        #(only_right, only_right_list),
        #(contain_both, both_list),
      ])
    }
    TextViewMsg(msg) -> text_view.update(model, msg)
  }
}

pub fn view(model: Model) -> element.Element(Msg) {
  let assert Ok(left_list) = dict.get(model, left)
  let assert Ok(right_list) = dict.get(model, right)

  let assert Ok(only_left_list) = dict.get(model, only_left)
  let assert Ok(only_right_list) = dict.get(model, only_right)

  let assert Ok(both_list) = dict.get(model, contain_both)

  let root_style = "flex flex-col px-4 py-16  m-auto gap-16 items-center"

  let view_list_style =
    "flex flex-col md:flex-row m-auto gap-4 px-4 items-center"

  html.div([attribute.id("root"), attribute.class(root_style)], [
    html.div([attribute.id("view-lists"), attribute.class(view_list_style)], [
      element.map(
        text_view.text_area(left, left_list),
        fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
      ),
      switch_button(),
      element.map(
        text_view.text_area(right, right_list),
        fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
      ),
    ]),
    compare_button(),
    html.div(
      [attribute.id("view-comparison-lists"), attribute.class(view_list_style)],
      [
        element.map(
          text_view.text_area(only_left, only_left_list),
          fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
        ),
        element.map(
          text_view.text_area(only_right, only_right_list),
          fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
        ),
      ],
    ),
    html.div(
      [attribute.id("view-both-lists"), attribute.class(view_list_style)],
      [
        element.map(
          text_view.text_area(contain_both, both_list),
          fn(a: text_view.TextAreaMsg) { TextViewMsg(a) },
        ),
      ],
    ),
  ])
}

fn switch_button() {
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
