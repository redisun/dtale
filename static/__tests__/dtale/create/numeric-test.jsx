import { mount } from "enzyme";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import DimensionsHelper from "../../DimensionsHelper";
import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

describe("DataViewer tests", () => {
  let result, CreateColumn;

  function findNumericInputs(r) {
    const { CreateNumeric } = require("../../../popups/create/CreateNumeric");
    return r.find(CreateNumeric).first();
  }

  function findLeftInputs(r) {
    return findNumericInputs(r).find("div.form-group").at(1);
  }

  const simulateClick = async r => {
    r.simulate("click");
    await tick();
  };

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    const { DataViewer } = require("../../../dtale/DataViewer");
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    await tick();
    clickMainMenuButton(result, "Build Column");
    await tick();
  });

  afterAll(dimensions.afterAll);

  it("DataViewer: build numeric cfg validation", () => {
    const { validateNumericCfg } = require("../../../popups/create/CreateNumeric");
    const cfg = {};
    expect(validateNumericCfg(cfg)).toBe("Please select an operation!");
    cfg.operation = "x";
    cfg.left = { type: "col", col: null };
    expect(validateNumericCfg(cfg)).toBe("Left side is missing a column selection!");
    cfg.left = { type: "val", val: null };
    expect(validateNumericCfg(cfg)).toBe("Left side is missing a static value!");
    cfg.left.val = "x";
    cfg.right = { type: "col", col: null };
    expect(validateNumericCfg(cfg)).toBe("Right side is missing a column selection!");
    cfg.right = { type: "val", val: null };
    expect(validateNumericCfg(cfg)).toBe("Right side is missing a static value!");
  });

  it("DataViewer: build numeric column", async () => {
    const { CreateNumeric } = require("../../../popups/create/CreateNumeric");
    expect(result.find(CreateColumn).length).toBe(1);
    result.find(Modal.Header).first().find("button").simulate("click");
    expect(result.find(CreateColumn).length).toBe(0);
    clickMainMenuButton(result, "Build Column");
    await tickUpdate(result);
    expect(result.find(CreateNumeric).length).toBe(1);
    result
      .find(CreateColumn)
      .find("div.form-group")
      .first()
      .find("input")
      .first()
      .simulate("change", { target: { value: "numeric_col" } });
    await simulateClick(findNumericInputs(result).find("div.form-group").first().find("button").first());
    await simulateClick(findLeftInputs(result).find("button").first());
    await simulateClick(findLeftInputs(result).find("button").last());
    await simulateClick(findLeftInputs(result).find("button").first());
    findLeftInputs(result).find(Select).first().instance().onChange({ value: "col1" });
    await tick();
    findNumericInputs(result).find("div.form-group").at(2).find(Select).first().instance().onChange({ value: "col2" });
    result.find("div.modal-footer").first().find("button").first().simulate("click");
    await tickUpdate(result);
    expect(result.find(CreateColumn)).toHaveLength(0);
  });
});
