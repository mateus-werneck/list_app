import gleam/int
import gleam/string
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import state
import string/lines

fn init(_flags) -> state.Model {
  state.Model([], [])
}

pub fn main() {
  let app = lustre.simple(init, state.update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

pub fn view(model: state.Model) -> element.Element(state.Msg) {
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
      attribute.id("root"),
      attribute.class("flex flex-col p-4 m-auto gap-16 items-center"),
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
          html.div([attribute.id("left-list")], [
            html.div([], [
              html.textarea(
                [
                  attribute.id("elements-left-list"),
                  attribute.class(
                    "w-80 lg:w-[540px] 2xl:w-[720px] h-48 lg:h-96 p-2 outline-none bg-white border-2 border-slate-200",
                  ),
                  event.on_input(state.UserLeftListTyping),
                ],
                left_text,
              ),
              html.span(
                [
                  attribute.id("left-list-counter"),
                  case left_count == "0" {
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
                [element.text(left_count)],
              ),
            ]),
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
          html.div([attribute.class("flex flex-col h-1/2")], [
            html.div([attribute.class("flex-1")], []),
            html.button(
              [
                attribute.id("switch-list-content"),
                attribute.class(
                  "p-4 bg-slate-400 items-center self-center hover:bg-slate-200 transition delay-75 duration-300 ease-in-out",
                ),
                event.on_click(state.UserSwitchListContents),
              ],
              [
                html.img([
                  attribute.src("/priv/static/images/switch.svg"),
                  attribute.class("w-5"),
                ]),
              ],
            ),
          ]),
          html.div([attribute.id("right-list")], [
            html.div([], [
              html.textarea(
                [
                  attribute.id("elements-right-list"),
                  attribute.class(
                    "w-80 lg:w-[540px] 2xl:w-[720px] h-48 lg:h-96 p-2 outline-none bg-white border-2 border-slate-200",
                  ),
                  event.on_input(state.UserRightListTyping),
                ],
                right_text,
              ),
              html.span(
                [
                  attribute.id("right-list-counter"),
                  case right_count == "0" {
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
                [element.text(right_count)],
              ),
            ]),
            html.div(
              [
                attribute.id("actions-right-list"),
                attribute.class(
                  "flex flex-row items-center gap-4 bg-slate-100 p-4 shadow-md",
                ),
              ],
              [
                html.button(
                  [
                    attribute.id("trim-right-list"),
                    attribute.title("Remover espaços em branco"),
                    attribute.class(
                      "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
                    ),
                    event.on_click(state.UserTrimRightListSpaces),
                  ],
                  [
                    html.img([
                      attribute.src("/priv/static/images/trim.svg"),
                      attribute.class("w-6"),
                    ]),
                  ],
                ),
                html.button(
                  [
                    attribute.id("sort-right-list"),
                    attribute.title("Ordernar lista"),
                    attribute.class(
                      "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
                    ),
                    event.on_click(state.UserSortAscRightList),
                  ],
                  [
                    html.img([
                      attribute.src("/priv/static/images/sort-asc.svg"),
                      attribute.class("w-6"),
                    ]),
                  ],
                ),
                html.button(
                  [
                    attribute.id("copy-right-list"),
                    attribute.title("Copiar para área de transferência"),
                    attribute.class(
                      "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
                    ),
                    event.on_click(state.UserCopyRightList),
                  ],
                  [
                    html.img([
                      attribute.src("/priv/static/images/copy.svg"),
                      attribute.class("w-6"),
                    ]),
                  ],
                ),
                html.button(
                  [
                    attribute.id("delete-right-list"),
                    attribute.title("Apagar conteúdo"),
                    attribute.class(
                      "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
                    ),
                    event.on_click(state.UserDeletedRightList),
                  ],
                  [
                    html.img([
                      attribute.src("/priv/static/images/delete.svg"),
                      attribute.class("w-6"),
                    ]),
                  ],
                ),
              ],
            ),
          ]),
        ],
      ),
      html.button(
        [
          attribute.id("compare-button"),
          attribute.class(
            "rounded-md text-indigo-600 border-2 border-indigo-600 p-4 bg-transparent hover:text-white hover:bg-indigo-600 transition delay-75 duration-300",
          ),
        ],
        [element.text("Comparar")],
      ),
    ],
  )
}
