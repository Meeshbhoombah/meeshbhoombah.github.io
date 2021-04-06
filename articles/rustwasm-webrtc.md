# Building a Multi-Threaded Browser-based Client around Webrtc
Or, a series of unfortunate events.

## Tuesday, April 6, 2021
### 10:13 AM
I've been working on this project for a few weeks now so we'll be jumping right
into the middle of what's going on. Sometime, in the future, I'll add more
context to what I've been working on.

The premise here is as stated in the title, however.

#### Mediasoup from Rust
Currently, after some spelunking (again, the context, which I have not yet
provided), I've come across `mediasoup` as the primarly library that I will be
leveraging, both client-side and server-side, for managing Data, Audio, and
Video streams.

This is because, the application that I am building, revolves around real-time
communication, in multiple regards. How, you'll have to see for yourself, when
the application is live.

That being said, currently, I'm attempting to take the `mediasoup-client` lib,
which I've injected into a `.ts` file that becomes the entry point for the 
final build of the client, from the `window` object that I've bound it to,
bringing it into Rust such that it is workable from WASM.

Within the `mediasoup-client` lib, there exists a `Device` class which is the
primary means through which I can connect with the project's `mediasoup` 
`Router` on the server-side.

I want to have this Device connection exist on its own thread in the client,
which I'm understanding is known as a **"Worker Thread"**. I've seen this 
before in React projects, as a "Service Worker," which I've come to learn is 
the worker for managing offline storage via the standardized `SessionStorage`
browser object.

I've gotta say, I watched the Lex Friedmen Podcast session featuring Brendan
Eich, that was some quality content.

I'm realizing I need to learn more about how to interact with the injected
object, I know that I'll have to leverage `web_sys` and `js_sys` in some form,
as I found `wasm-bindgen`'s given method for working with JavaScript to be a 
bit convuluted, that is:
```rust
#[wasm_bindgen]
extern "C" {
    ...
}
``` 

In doing this, one can add declerations for types, functions, etc. in manners
that they have determined to best reflect the concepts that are being expressed
by Javascript.

The only issue with this is that I need to know what the types of `mediasoup`'s
object's are, in Javascript, then I must determine how they would be imported 
into Rust, via `wasm-bindgen`. This is an issue, because I do not know what 
those types are, at the moment.

Luckily, for me, there is a thorough [set of docs.](https://mediasoup.org/documentation/v3/mediasoup-client/api/$)
With these, I should be able to determine the typing, adapt it to Rust, and have
it be workable from the `connection.rs` module I'm building. 



