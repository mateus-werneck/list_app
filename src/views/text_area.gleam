pub type TextAreaMsg {
  UserSwitchListContents
  UserCompareListContents

  UserListTyping(String, String)
  UserTrimListSpaces(String)
  UserSortList(String)
  UserCopyList(String)
  UserDeletedList(String)
}
