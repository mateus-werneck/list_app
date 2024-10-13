import gleam/javascript/promise
import gleam/list
import gleam/string
import plinth/browser/clipboard
import plinth/browser/window
import string/lines

pub type Model {
  Model(left_list: List(String), right_list: List(String))
}

pub type Msg {
  UserLeftListTyping(String)
  UserRightListTyping(String)
  UserSwitchListContents
  UserTrimRightListSpaces
  UserSortAscRightList
  UserCopyRightList
  UserDeletedRightList
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserLeftListTyping(value) ->
      Model(..model, left_list: lines.text_to_lines(value))
    UserRightListTyping(value) ->
      Model(..model, right_list: lines.text_to_lines(value))

    UserSwitchListContents ->
      Model(left_list: model.right_list, right_list: model.left_list)

    UserTrimRightListSpaces ->
      Model(
        ..model,
        right_list: list.filter(model.right_list, fn(x) { x != "" && x != "\n" }),
      )
    UserSortAscRightList ->
      Model(..model, right_list: list.sort(model.right_list, string.compare))
    UserCopyRightList -> {
      promise.await(
        clipboard.write_text(string.join(model.right_list, with: "")),
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
      model
    }
    UserDeletedRightList -> Model(..model, right_list: [])
  }
}
