import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import state
import views/left_list
import views/right_list

pub fn main() {
  let app = lustre.simple(state.init, state.update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

pub fn view(model: state.Model) -> element.Element(state.Msg) {
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
          left_list.view(left_list.LeftListProps("left-list", model.left_list)),
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
          right_list.view(right_list.RightListProps(
            "right-list",
            model.right_list,
          )),
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
