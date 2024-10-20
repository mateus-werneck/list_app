import gleam/dict
import kielet/context.{Context}
import kielet/database
import kielet/language
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import simplifile
import storage/constants
import views/compare_button
import views/switch_button
import views/text_view

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

pub type Model {
  Model(lists: dict.Dict(String, List(String)), ctx: context.Context)
}

pub type Msg {
  TextViewMsg(text_view.TextAreaMsg)
  SwitchViewMsg(switch_button.SwitchListMsg)
  CompareViewMsg(compare_button.CompareListMsg)
}

pub fn init(_flags) -> Model {
  let assert Ok(mo_data) = simplifile.read_bits("./translations/pt-br.mo")
  let assert Ok(portuguese) = language.load("pt_BR", mo_data)
  let db = database.new() |> database.add_language(portuguese)

  let ctx = Context(db, "pt_BR")

  Model(
    dict.from_list([
      #(constants.left, []),
      #(constants.right, []),
      #(constants.only_left, []),
      #(constants.only_right, []),
      #(constants.contain_both, []),
    ]),
    ctx,
  )
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    TextViewMsg(msg) ->
      Model(..model, lists: text_view.update(model.lists, msg))
    SwitchViewMsg(msg) ->
      Model(..model, lists: switch_button.update(model.lists, msg))
    CompareViewMsg(msg) ->
      Model(..model, lists: compare_button.update(model.lists, msg))
  }
}

pub fn view(model: Model) -> element.Element(Msg) {
  let assert Ok(left_list) = dict.get(model.lists, constants.left)
  let assert Ok(right_list) = dict.get(model.lists, constants.right)

  let assert Ok(only_left_list) = dict.get(model.lists, constants.only_left)
  let assert Ok(only_right_list) = dict.get(model.lists, constants.only_right)

  let assert Ok(both_list) = dict.get(model.lists, constants.contain_both)
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
    element.map(
      compare_button.view(model.ctx),
      fn(a: compare_button.CompareListMsg) { CompareViewMsg(a) },
    ),
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
