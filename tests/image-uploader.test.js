const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadComponent } = require("./helpers/load-miniprogram-module");

const COMPONENT_PATH = path.join(__dirname, "../miniprogram/components/image-uploader/index.js");

function createComponent(wxApi) {
  const definition = loadComponent(COMPONENT_PATH, {
    "../../data/db": { isCloudMode: () => true }
  }, { wx: wxApi });
  const events = [];
  const component = {
    data: {
      imageUrl: "cloud://old-image",
      uploading: false,
      cloudPath: "covers/apartments"
    },
    setData(updates) {
      Object.assign(this.data, updates);
    },
    triggerEvent(name, detail) {
      events.push({ name, detail });
    }
  };
  Object.entries(definition.methods).forEach(([name, method]) => {
    component[name] = method.bind(component);
  });
  return { component, events };
}

test("cloud upload failure preserves the previous image and emits uploaderror only", () => {
  let uploadOptions;
  const { component, events } = createComponent({
    showLoading() {},
    hideLoading() {},
    showToast() {},
    cloud: {
      uploadFile(options) {
        uploadOptions = options;
      }
    }
  });

  component.uploadImage("/tmp/new-image.jpg");
  uploadOptions.fail({ errMsg: "network error" });

  assert.equal(component.data.imageUrl, "cloud://old-image");
  assert.deepEqual(events.filter((event) => event.name === "change"), []);
  assert.equal(events.filter((event) => event.name === "uploaderror").length, 1);
});

test("images larger than 5MB are rejected before upload", () => {
  let uploadCalled = false;
  const toasts = [];
  const { component } = createComponent({
    chooseMedia(options) {
      options.success({
        tempFiles: [{ tempFilePath: "/tmp/large.jpg", size: 5 * 1024 * 1024 + 1 }]
      });
    },
    showToast(args) {
      toasts.push(args);
    },
    showLoading() {},
    hideLoading() {},
    cloud: {
      uploadFile() {
        uploadCalled = true;
      }
    }
  });

  component.chooseImage();

  assert.equal(uploadCalled, false);
  assert.match(toasts[0].title, /5MB/);
});
