local frameConstructors = {
  ExtendedCheckBox  = Library.LibExtendedWidgets.Checkbox,
  SimpleGrid        = Library.LibExtendedWidgets.Grid,
  SimpleList        = Library.LibExtendedWidgets.List,
  SimpleRadioButton = Library.LibExtendedWidgets.RadioButton,
  SimpleScrollList  = Library.LibExtendedWidgets.ScrollList,
  SimpleScrollView  = Library.LibExtendedWidgets.ScrollView,
  SimpleSelect      = Library.LibExtendedWidgets.Select,
  SimpleSlider      = Library.LibExtendedWidgets.Slider,
  SimpleTabView     = Library.LibExtendedWidgets.TabView,
  SimpleTextArea    = Library.LibExtendedWidgets.TextArea,
  ExtendedTooltip   = Library.LibExtendedWidgets.Tooltip,
  SimpleWindow      = Library.LibExtendedWidgets.Window,
  
}

local oldUICreateFrame = UI.CreateFrame
UI.CreateFrame = function(frameType, name, parent)
  assert(type(frameType) == "string", "param 1 must be a string!")
  assert(type(name) == "string", "param 2 must be a string!")
  assert(type(parent) == "table", "param 3 must be a valid frame parent!")

  local constructor = frameConstructors[frameType]
  if constructor then
    return constructor(name, parent)
  else
    return oldUICreateFrame(frameType, name, parent)
  end
end
