# Walkthrough - Updates

## Changes

### Auth

#### [login.html](file:///c:/Users/User/Documents/priority%20projects/type-3%20cursor/full_stack-flask_shop_template/templates/auth/login.html)
- Wrapped the password input in a Bootstrap `input-group`.
- Added a "Show/Hide" toggle button using Bootstrap Icons (`bi-eye` / `bi-eye-slash`).
- Added JavaScript to handle the toggle logic (switching `type="password"` to `type="text"`).

#### [register.html](file:///c:/Users/User/Documents/priority%20projects/type-3%20cursor/full_stack-flask_shop_template/templates/auth/register.html)
- Applied similar changes to both "Password" and "Confirm Password" fields.
- Added a reusable JavaScript function `setupToggle` to handle multiple password fields on the same page.

### Home Screen

#### [index.html](file:///c:/Users/User/Documents/priority%20projects/type-3%20cursor/full_stack-flask_shop_template/templates/main/index.html)
- Updated welcome text to "Sarah & Co Nairobi's very own".
- Changed "Free Shipping" text to "Fast and effective delivery".
- Removed the "Easy Return" section.

## How to Modify FAQ

The Frequently Asked Questions (FAQ) section is located in `templates/main/index.html`. It uses the Bootstrap Accordion component.

To modify the questions or answers:

1.  Open `templates/main/index.html`.
2.  Search for the section starting with `<!-- F.A.Q. -->`.
3.  Each question is inside a `<button class="accordion-button ...">`.
4.  Each answer is inside a `<div class="accordion-body">`.

Example structure:

```html
<div class="accordion-item">
    <h3 class="accordion-header">
        <!-- Edit Question Here -->
        <button class="accordion-button collapsed" type="button" ...>
            What are the delivery times?
        </button>
    </h3>

    <div id="faq-collapse-1" ...>
        <!-- Edit Answer Here -->
        <div class="accordion-body">
            We ship your order within 24h...
        </div>
    </div>
</div>
```

To add a new question, copy an entire `<div class="accordion-item">...</div>` block and update the `id` attributes (e.g., change `faq-collapse-1` to `faq-collapse-new`).

## Verification Results

### Manual Verification
1.  **Login/Register**: Confirmed toggle button works and icon updates.
2.  **Home Screen**: Verified text updates and removal of the Easy Return column.
