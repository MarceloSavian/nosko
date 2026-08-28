import { fireEvent, render, screen } from "@testing-library/react"
import { App } from "./App"

describe("App", () => {
  it("renders the Portuguese overview label by default", () => {
    render(<App />)
    expect(screen.getByRole("navigation")).toHaveTextContent("Visão geral")
  })

  it("switches language when the toggle is clicked", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("navigation")).toHaveTextContent("Overview")
  })
})
