import { Editor } from "./core/editor.js";

new Editor(document.body, {
	language: "cpp",
	initialInput: `#include <iostream>

int main() {
  std::cout << "Hello, world!" << std::endl;
  return 0;
}`,
});
