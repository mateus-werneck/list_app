import gleam/dict
import gleam/int
import gleam/javascript/promise
import gleam/list
import gleam/option
import gleam/string
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import plinth/browser/clipboard
import plinth/browser/window
import string/lines

pub type TextAreaMsg {
  UserListTyping(String, String)
  UserTrimListSpaces(String)
  UserSortList(String)
  UserCopyList(String)
  UserDeletedList(String)
}

pub fn update(model: dict.Dict(String, List(String)), msg: TextAreaMsg) {
  case msg {
    UserListTyping(name, content) ->
      dict.merge(model, dict.from_list([#(name, lines.text_to_lines(content))]))

    UserTrimListSpaces(name) -> {
      let trim = fn(x) {
        case x {
          option.Some(current_list) ->
            list.filter(current_list, fn(e) { e != "" && e != "\n" })
          option.None -> []
        }
      }

      dict.upsert(model, name, trim)
    }

    UserSortList(name) -> {
      let sort = fn(x) {
        case x {
          option.Some(current_list) -> list.sort(current_list, string.compare)
          option.None -> []
        }
      }

      dict.upsert(model, name, sort)
    }

    UserDeletedList(name) -> dict.merge(model, dict.from_list([#(name, [])]))

    UserCopyList(data) -> {
      clipboard(data)
      model
    }
  }
}

fn clipboard(data: String) {
  promise.await(clipboard.write_text(data), fn(result) {
    case result {
      Ok(_) ->
        promise.new(fn(_) {
          window.alert("Copiado para área de transferência.")
          Nil
        })
      Error(_) -> {
        promise.new(fn(_) {
          window.alert("Falha ao copiar lista para área de transferência")
          Nil
        })
      }
    }
  })
}

pub fn text_area(
  name: String,
  content: List(String),
) -> element.Element(TextAreaMsg) {
  let text = string.join(content, with: "")

  let count =
    lines.count_text_lines(content)
    |> int.to_string

  let text_area_style =
    "w-80 lg:w-[540px] 2xl:w-[720px] h-48 lg:h-96 p-2 outline-none"
    <> " bg-white border-2 border-slate-200"

  let action_buttons_style =
    "flex flex-row items-center gap-4 bg-slate-100 p-4 shadow-md"

  html.div([attribute.id(name)], [
    html.div([], [
      html.textarea(
        [
          attribute.id(name),
          attribute.class(text_area_style),
          event.on_input(fn(value) { UserListTyping(name, value) }),
        ],
        text,
      ),
      text_counter("counter-" <> name, count),
    ]),
    html.div(
      [attribute.id("actions-" <> name), attribute.class(action_buttons_style)],
      [
        action_button(
          "trim-" <> name,
          "Remover espaços em branco",
          "/priv/static/images/trim.svg",
          UserTrimListSpaces(name),
        ),
        action_button(
          "sort-" <> name,
          "Ordernar lista",
          "/priv/static/images/sort-asc.svg",
          UserSortList(name),
        ),
        action_button(
          "copy-" <> name,
          "Copiar para área de transferência",
          "/priv/static/images/copy.svg",
          UserCopyList(string.join(content, "")),
        ),
        action_button(
          "delete-" <> name,
          "Apagar conteúdo",
          "/priv/static/images/delete.svg",
          UserDeletedList(name),
        ),
      ],
    ),
  ])
}

fn text_counter(name: String, count: String) {
  let zero_counter_style =
    "flex flex-row  text-slate-200 z-10 relative mt-[-1.75rem] mr-4 justify-end"
  let counter_style =
    "flex flex-row text-black z-10 relative mt-[-1.75rem] mr-4 justify-end"

  html.span(
    [
      attribute.id(name),
      case count == "0" {
        True -> attribute.class(zero_counter_style)
        False -> attribute.class(counter_style)
      },
    ],
    [element.text(count)],
  )
}

fn action_button(name: String, title: String, img: String, msg: msg) {
  let style =
    "items-center self-center hover:filter hover:invert transition delay-100 duration-300"

  html.button(
    [
      attribute.id(name),
      attribute.title(title),
      attribute.class(style),
      event.on_click(msg),
    ],
    [html.img([attribute.src(img), attribute.class("w-6")])],
  )
}
