import gleam/int
import gleam/string
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import state
import string/lines

pub type LeftListProps(msg) {
  LeftListProps(name: String, data: List(String))
}

pub fn view(props: LeftListProps(state.Msg)) -> element.Element(state.Msg) {
  let text = string.join(props.data, with: "")
  let count =
    lines.count_text_lines(props.data)
    |> int.to_string

  html.div([attribute.id(props.name)], [
    html.div([], [
      html.textarea(
        [
          attribute.id("elements-" <> props.name),
          attribute.class(
            "w-80 lg:w-[540px] 2xl:w-[720px] h-48 lg:h-96 p-2 outline-none bg-white border-2 border-slate-200",
          ),
          event.on_input(state.UserLeftListTyping),
        ],
        text,
      ),
      html.span(
        [
          attribute.id("counter-" <> props.name),
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
      ),
    ]),
    html.div(
      [
        attribute.id("actions-" <> props.name),
        attribute.class(
          "flex flex-row items-center gap-4 bg-slate-100 p-4 shadow-md",
        ),
      ],
      [
        html.button(
          [
            attribute.id("trim-" <> props.name),
            attribute.title("Remover espaços em branco"),
            attribute.class(
              "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
            ),
            event.on_click(state.UserTrimLeftListSpaces),
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
            attribute.id("sort-" <> props.name),
            attribute.title("Ordernar lista"),
            attribute.class(
              "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
            ),
            event.on_click(state.UserSortLeftList),
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
            attribute.id("copy-" <> props.name),
            attribute.title("Copiar para área de transferência"),
            attribute.class(
              "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
            ),
            event.on_click(state.UserCopyLeftList),
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
            attribute.id("delete-" <> props.name),
            attribute.title("Apagar conteúdo"),
            attribute.class(
              "items-center self-center hover:filter hover:invert transition delay-100 duration-300",
            ),
            event.on_click(state.UserDeletedLeftList),
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
  ])
}
