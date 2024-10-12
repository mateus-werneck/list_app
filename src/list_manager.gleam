import gleam/int
import gleam/string
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import string/lines

pub type Model {
  Model(left_list: List(String), right_list: List(String))
}

pub type Msg {
  UserLeftListTyping(String)
  UserRightListTyping(String)
  UserSwitchListContents
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserLeftListTyping(value) ->
      Model(..model, left_list: lines.text_to_lines(value))
    UserRightListTyping(value) ->
      Model(..model, right_list: lines.text_to_lines(value))

    UserSwitchListContents ->
      Model(left_list: model.right_list, right_list: model.left_list)
  }
}

fn init(_flags) -> Model {
  Model([], [])
}

pub fn view(model: Model) -> element.Element(Msg) {
  let left_text = string.join(model.left_list, with: "")
  let left_count =
    lines.count_text_lines(model.left_list)
    |> int.to_string

  let right_text = string.join(model.right_list, with: "")
  let right_count =
    lines.count_text_lines(model.right_list)
    |> int.to_string

  html.div(
    [
      attribute.id("view-lists"),
      attribute.class(
        "flex flex-row m-auto gap-4 justify-center items-center self-center h-full",
      ),
    ],
    [
      html.div([attribute.id("left-list"), attribute.class("w-96 h-48")], [
        html.div(
          [
            attribute.id("title-left-list"),
            attribute.class(
              "flex flex-row gap-4 items-center font-bold p-4 bg-emerald-400",
            ),
          ],
          [
            html.span([attribute.class("flex-1")], [element.text("Lista Um")]),
            html.span(
              [
                attribute.id("counter-left-list"),
                attribute.class(
                  "bg-emerald-800 text-white text-lg p-2 rounded-md",
                ),
              ],
              [element.text(left_count)],
            ),
          ],
        ),
        html.textarea(
          [
            attribute.id("elements-left-list"),
            attribute.class(
              "w-full h-full p-2 outline-none bg-white border-l-2 border-r-2 border-slate-200",
            ),
            event.on_input(UserLeftListTyping),
          ],
          left_text,
        ),
        html.div(
          [
            attribute.id("actions-left-list"),
            attribute.class("items-center bg-slate-100 p-4 shadow-md"),
          ],
          [
            html.button(
              [
                attribute.id("duplicate-left-list"),
                attribute.title("Remover elementos duplicados"),
                attribute.class(
                  "items-center hover:filter hover:brightness-190 hover:invert transition delay-100 duration-300",
                ),
              ],
              [
                html.img([
                  attribute.src("/priv/static/images/duplicate.svg"),
                  attribute.class("w-8"),
                ]),
              ],
            ),
          ],
        ),
      ]),
      html.div([attribute.class("flex flex-col h-48")], [
        html.div([attribute.class("flex-1")], []),
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
        ),
      ]),
      html.div([attribute.id("right-list"), attribute.class("w-96 h-48")], [
        html.div(
          [
            attribute.id("title-right-list"),
            attribute.class(
              "flex flex-row gap-4 items-center font-bold p-4 bg-emerald-400",
            ),
          ],
          [
            html.span([attribute.class("flex-1")], [element.text("Lista Dois")]),
            html.span(
              [
                attribute.id("counter-right-list"),
                attribute.class(
                  "bg-emerald-800 text-white text-lg p-2 rounded-md",
                ),
              ],
              [element.text(right_count)],
            ),
          ],
        ),
        html.textarea(
          [
            attribute.id("elements-right-list"),
            attribute.class(
              "w-full h-full p-2 outline-none bg-white border-l-2 border-r-2 border-slate-200",
            ),
            event.on_input(UserRightListTyping),
          ],
          right_text,
        ),
        html.div(
          [
            attribute.id("actions-right-list"),
            attribute.class("items-center bg-slate-100 p-4 shadow-md"),
          ],
          [
            html.button(
              [
                attribute.id("duplicate-right-list"),
                attribute.title("Remover elementos duplicados"),
                attribute.class(
                  "items-center hover:filter hover:brightness-190 hover:invert transition delay-100 duration-300",
                ),
              ],
              [
                html.img([
                  attribute.src("/priv/static/images/duplicate.svg"),
                  attribute.class("w-8"),
                ]),
              ],
            ),
          ],
        ),
      ]),
    ],
  )
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
