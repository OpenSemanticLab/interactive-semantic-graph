# Examples

<!-- markdownlint-disable-next-line MD036 -->
**Table of Content**

- [Examples](#examples)
  - [Bootstrap](#bootstrap)
  - [Fontawesome](#fontawesome)
  - [Nodemon](#nodemon)

## Bootstrap

There are different ways to use bootstrap, see [Bootstrap Docs](https://getbootstrap.com/) for more information.

1. Using CDN import for direct integration

    ```html
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9"
      crossorigin="anonymous"
    />
    ```

2. Install via `npm`:

    ```bash
    npm i bootstrap@5.3.1
    ```

## Fontawesome

A icon library and toolkit. Take a look at [Font Awesome](https://fontawesome.com/)

```html
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
  integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
/>
```

## Nodemon

To avoid having to run the **npm run build** command to display changes made to the webpage - run nodemon

1. To install nodemon globally:

    ```bash
    npm install -g nodemon
    ```

2. To execute `nodemon` using custom command:

    ```bash
    nodemon --exec "npm run build"
    ```

    To stop the process, press `Ctrl + C`.
