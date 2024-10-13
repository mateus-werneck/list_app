import gleam/dict
import gleam/dynamic
import gleam/int
import gleam/javascript/promise
import gleam/list
import gleam/string
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import lustre/event
import plinth/browser/clipboard
import plinth/browser/window
import string/lines

pub type Model {
  Model(name: String, text_lines: List(String))
}

pub type Msg {
  InitListNameAttribute(String)
  UserListTyping(String)
  UserTrimListSpaces
  UserSortList
  UserCopyList
  UserDeletedList
}

pub fn list_view_component() -> lustre.App(Nil, Model, Msg) {
  lustre.component(
    init,
    update,
    view,
    dict.from_list([
      #("name", fn(attr: dynamic.Dynamic) {
        case dynamic.string(attr) {
          Ok(value) -> Ok(InitListNameAttribute(value))
          Error(e) -> Error(e)
        }
      }),
    ]),
  )
}

pub fn init(_flags) -> #(Model, effect.Effect(Msg)) {
  #(Model("list", []), effect.none())
}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    InitListNameAttribute(name) -> #(Model(..model, name: name), effect.none())

    UserListTyping(value) -> #(
      Model(..model, text_lines: lines.text_to_lines(value)),
      effect.none(),
    )

    UserTrimListSpaces -> #(
      Model(
        ..model,
        text_lines: list.filter(model.text_lines, fn(x) { x != "" && x != "\n" }),
      ),
      effect.none(),
    )

    UserSortList -> #(
      Model(..model, text_lines: list.sort(model.text_lines, string.compare)),
      effect.none(),
    )

    UserCopyList -> {
      promise.await(
        clipboard.write_text(string.join(model.text_lines, with: "")),
        fn(result) {
          case result {
            Ok(_) ->
              promise.new(fn(_) {
                window.alert("Copiado para área de transferência.")
                Nil
              })
            Error(_) -> {
              promise.new(fn(_) {
                window.alert(
                  "Falha ao copiar lista para área de transferência",
                )
                Nil
              })
            }
          }
        },
      )
      #(model, effect.none())
    }

    UserDeletedList -> #(Model(..model, text_lines: []), effect.none())
  }
}

pub fn view(model: Model) -> element.Element(Msg) {
  let text = string.join(model.text_lines, with: "")
  let count =
    lines.count_text_lines(model.text_lines)
    |> int.to_string

  html.div([attribute.id(model.name)], [
    html.div([], [
      text_area("elements-" <> model.name, text, UserListTyping),
      counter("counter-" <> model.name, count),
    ]),
    html.div(
      [
        attribute.id("actions-" <> model.name),
        attribute.class(
          "flex flex-row items-center gap-4 bg-slate-100 p-4 shadow-md",
        ),
      ],
      [
        action_button(
          "trim-" <> model.name,
          "Remover espaços em branco",
          "/priv/static/images/trim.svg",
          UserTrimListSpaces,
        ),
        action_button(
          "sort-" <> model.name,
          "Ordernar lista",
          "/priv/static/images/sort-asc.svg",
          UserSortList,
        ),
        action_button(
          "copy-" <> model.name,
          "Copiar para área de transferência",
          "/priv/static/images/copy.svg",
          UserCopyList,
        ),
        action_button(
          "delete-" <> model.name,
          "Apagar conteúdo",
          "/priv/static/images/delete.svg",
          UserDeletedList,
        ),
      ],
    ),
  ])
}

fn text_area(name: String, content: String, msg: fn(String) -> Msg) {
  html.textarea(
    [
      attribute.id(name),
      attribute.class(
        "w-80 lg:w-[540px] 2xl:w-[720px] h-48 lg:h-96 p-2 outline-none bg-white border-2 border-slate-200",
      ),
      event.on_input(msg),
    ],
    content,
  )
}

fn counter(name: String, count: String) {
  html.span(
    [
      attribute.id(name),
      case count == "0" {
        True ->
          attribute.class(
            "flex flex-row  text-slate-200 z-10 relative mt-[-1.75rem] mr-4 justify-end",
          )
        False ->
          attribute.class(
            "flex flex-row text-black z-10 relative mt-[-1.75rem] mr-4 justify-end",
          )
      },
    ],
    [element.text(count)],
  )
}

fn action_button(name: String, title: String, img: String, msg: Msg) {
  html.button(
    [
      attribute.id(name),
      attribute.title(title),
      attribute.class(
        "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
      ),
      event.on_click(msg),
    ],
    [html.img([attribute.src(img), attribute.class("w-6")])],
  )
}
