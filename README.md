# Roam-Templates

This is my first attempt (about 5 concentrated hours) at creating a chrome extension to implement templates in Roam Research. It didn't work. There's no API published yet. They're working on it, but don't count on it right now. 

For anybody who may want to try, here's what I learned: 

- Feel free to look at the code to see how I scraped the HTML and nested divs. But it's very strange because you can't actually just set text in a bullet. 
- If you're a long-time user of Roam you know bullets have two forms: (1) this sort of "preview" and then when you click into it (2) the actual text. 
- The problem is, that 2nd form only appears to get loaded after you physically click into the bullet. Essentially, before there's a span containing the preview text, then when you click it, a textarea is generated with the actual text. 
- So there's some shenanigans going on with actually being able to edit information. I tried copy pasting, but I didn't know how to generate the textarea and force a click. 
- Trying to force a click didn't work, but I'm also not a web developer so I don't know how it works in general. 

gl hf, roam on. 
