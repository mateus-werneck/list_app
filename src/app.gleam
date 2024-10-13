import components/list_view
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) =
    lustre.register(list_view.list_view_component(), "list-view")

  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

pub type Model {
  Model(left_list: List(String), right_list: List(String))
}

pub type Msg {
  UserSwitchListContents
}

pub fn init(_flags) -> Model {
  Model([], [])
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserSwitchListContents ->
      Model(left_list: model.right_list, right_list: model.left_list)
  }
}

pub fn view(_model: Model) -> element.Element(Msg) {
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
          element.element("list-view", [attribute.name("left-list")], []),
          switch_button(),
          element.element("list-view", [attribute.name("right-list")], []),
        ],
      ),
      compare_button(),
    ],
  )
}

pub fn switch_button() {
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

pub fn compare_button() {
  html.button(
    [
      attribute.id("compare-button"),
      attribute.class(
        "rounded-md text-indigo-600 border-2 border-indigo-600 p-4 bg-transparent hover:text-white hover:bg-indigo-600 transition delay-75 duration-300",
      ),
    ],
    [element.text("Comparar")],
  )
}
