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
  UserSwitchListContents

  UserLeftListTyping(String)
  UserTrimLeftListSpaces
  UserSortLeftList
  UserCopyLeftList
  UserDeletedLeftList

  UserRightListTyping(String)
  UserTrimRightListSpaces
  UserSortRightList
  UserCopyRightList
  UserDeletedRightList
}

pub fn init(_flags) -> Model {
  Model([], [])
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserSwitchListContents ->
      Model(left_list: model.right_list, right_list: model.left_list)
    UserLeftListTyping(value) ->
      Model(..model, left_list: lines.text_to_lines(value))
    UserTrimLeftListSpaces ->
      Model(
        ..model,
        left_list: list.filter(model.left_list, fn(x) { x != "" && x != "\n" }),
      )
    UserSortLeftList ->
      Model(..model, left_list: list.sort(model.left_list, string.compare))
    UserCopyLeftList -> {
      promise.await(
        clipboard.write_text(string.join(model.left_list, with: "")),
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
    UserDeletedLeftList -> Model(..model, left_list: [])

    UserRightListTyping(value) ->
      Model(..model, right_list: lines.text_to_lines(value))
    UserTrimRightListSpaces ->
      Model(
        ..model,
        right_list: list.filter(model.left_list, fn(x) { x != "" && x != "\n" }),
      )
    UserSortRightList ->
      Model(..model, right_list: list.sort(model.left_list, string.compare))
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
