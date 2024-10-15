import gleam/dict
import gleam/int
import gleam/javascript/promise
import gleam/list
import gleam/option
import gleam/string
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import plinth/browser/clipboard
import plinth/browser/window
import string/lines

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

  UserListTyping(String, String)
  UserTrimListSpaces(String)
  UserSortList(String)
  UserCopyList(String)
  UserDeletedList(String)
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

      dict.from_list([
        #(left, right_list),
        #(right, left_list),
        #(only_left, only_right_list),
        #(only_right, only_left_list),
      ])
    }

    UserCompareListContents -> {
      let assert Ok(left_list) = dict.get(model, left)
      let assert Ok(right_list) = dict.get(model, right)

      let only_left_list =
        list.filter(left_list, fn(x) { !list.contains(right_list, x) })
      let only_right_list =
        list.filter(right_list, fn(x) { !list.contains(left_list, x) })

      dict.from_list([
        #(left, left_list),
        #(right, right_list),
        #(only_left, only_left_list),
        #(only_right, only_right_list),
      ])
    }

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

pub fn view(model: Model) -> element.Element(Msg) {
  let assert Ok(left_list) = dict.get(model, left)
  let assert Ok(right_list) = dict.get(model, right)

  let assert Ok(only_left_list) = dict.get(model, only_left)
  let assert Ok(only_right_list) = dict.get(model, only_right)

  html.div(
    [
      attribute.id("root"),
      attribute.class("flex flex-col px-4 py-16  m-auto gap-16 items-center"),
    ],
    [
      html.div(
        [
          attribute.id("view-lists"),
          attribute.class(
            "flex flex-col md:flex-row m-auto gap-4 px-4 items-center",
          ),
        ],
        [
          text_area(left, left_list),
          switch_button(),
          text_area(right, right_list),
        ],
      ),
      compare_button(),
      html.div(
        [
          attribute.id("view-lists"),
          attribute.class(
            "flex flex-col md:flex-row m-auto gap-4 px-4 items-center",
          ),
        ],
        [
          text_area(only_left, only_left_list),
          text_area(only_right, only_right_list),
        ],
      ),
    ],
  )
}

fn switch_button() {
  html.button(
    [
      attribute.id("switch-list-content"),
      attribute.class(
        "p-4 bg-slate-400 items-center self-center hover:bg-slate-200 transition delay-75 duration-300 ease-in-out",
      ),
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
  html.button(
    [
      attribute.id("compare-button"),
      attribute.class(
        "rounded-md text-indigo-600 border-2 border-indigo-600 p-4 bg-transparent hover:text-white hover:bg-indigo-600 transition delay-75 duration-300",
      ),
      event.on_click(UserCompareListContents),
    ],
    [element.text("Comparar")],
  )
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

fn text_area(name: String, content: List(String)) -> element.Element(Msg) {
  let text = string.join(content, with: "")

  let count =
    lines.count_text_lines(content)
    |> int.to_string

  html.div([attribute.id(name)], [
    html.div([], [
      html.textarea(
        [
          attribute.id(name),
          attribute.class(
            "w-80 lg:w-[540px] 2xl:w-[720px] h-48 lg:h-96 p-2 outline-none bg-white border-2 border-slate-200",
          ),
          event.on_input(fn(value) { UserListTyping(name, value) }),
        ],
        text,
      ),
      text_counter("counter-" <> name, count),
    ]),
    html.div(
      [
        attribute.id("actions-" <> name),
        attribute.class(
          "flex flex-row items-center gap-4 bg-slate-100 p-4 shadow-md",
        ),
      ],
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
