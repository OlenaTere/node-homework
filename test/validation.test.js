const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation tests", () => {
    it("1. doesn't permit a trivial password", () => {
      const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com", password: "password" },
        { abortEarly: false },
      );
  
      expect(
        error.details.find((detail) => detail.context.key == "password"),
      ).toBeDefined();
    });

    it("2. requires that an email be specified.", () => {
        const { error } = userSchema.validate(
          { name: "Bob", password: "StrongPass123!" },
          { abortEarly: false },
        );
    
        expect(
          error.details.find((detail) => detail.context.key == "email"),
        ).toBeDefined();
      });
    
      it("3. does not accept an invalid email.", () => {
        const { error } = userSchema.validate(
          { name: "Bob", email: "not-an-email", password: "StrongPass123!" },
          { abortEarly: false },
        );
    
        expect(
          error.details.find((detail) => detail.context.key == "email"),
        ).toBeDefined();
      });
    
      it("4. requires a password.", () => {
        const { error } = userSchema.validate(
          { name: "Bob", email: "bob@sample.com" },
          { abortEarly: false },
        );
    
        expect(
          error.details.find((detail) => detail.context.key == "password"),
        ).toBeDefined();
      });
    
      it("5. requires name.", () => {
        const { error } = userSchema.validate(
          { email: "bob@sample.com", password: "StrongPass123!" },
          { abortEarly: false },
        );
    
        expect(
          error.details.find((detail) => detail.context.key == "name"),
        ).toBeDefined();
      });
    
      it("6. name must be valid (3 to 30 characters).", () => {
        const { error } = userSchema.validate(
          { name: "Al", email: "bob@sample.com", password: "StrongPass123!" },
          { abortEarly: false },
        );
    
        expect(
          error.details.find((detail) => detail.context.key == "name"),
        ).toBeDefined();
      });
    
      it("7. if validation is performed on a valid user object, error comes back falsy.", () => {
        const { error } = userSchema.validate(
          { name: "Bobby", email: "bob@sample.com", password: "StrongPass123!" },
          { abortEarly: false },
        );
    
        expect(error).toBeFalsy();
      });
  });

  describe("task object validation tests", () => {
    it("8. task schema requires a title.", () => {
      const { error } = taskSchema.validate(
        { isCompleted: false },
        { abortEarly: false },
      );
  
      expect(
        error.details.find((detail) => detail.context.key == "title"),
      ).toBeDefined();
    });
  
    it("9. if an isCompleted value is specified, it must be valid.", () => {
      const { error } = taskSchema.validate(
        { title: "Test title", isCompleted: "yes" },
        { abortEarly: false },
      );
  
      expect(
        error.details.find((detail) => detail.context.key == "isCompleted"),
      ).toBeDefined();
    });
  
    it("10. if isCompleted is not specified but rest is valid, default false is provided.", () => {
      const { value } = taskSchema.validate(
        { title: "Test title" },
        { abortEarly: false },
      );
  
      expect(value.isCompleted).toBe(false);
    });
  
    it("11. if isCompleted is true, it remains true after validation.", () => {
      const { value } = taskSchema.validate(
        { title: "Test title", isCompleted: true },
        { abortEarly: false },
      );
  
      expect(value.isCompleted).toBe(true);
    });
  });

  describe("patch task object validation tests", () => {
    it("12. patchTaskSchema does not require a title.", () => {
      const { error } = patchTaskSchema.validate(
        { isCompleted: true },
        { abortEarly: false },
      );
  
      expect(error).toBeFalsy();
    });
  
    it("13. if no value is provided for isCompleted, it remains undefined in returned value.", () => {
      const { value } = patchTaskSchema.validate(
        { title: "Updated title" },
        { abortEarly: false },
      );
  
      expect(value.isCompleted).toBeUndefined();
    });
  });