<script>
    import { invoke } from "@tauri-apps/api/tauri"

    let name = "";
    let greetMsg = ""
    let files = []

    async function greet(){
      // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
      greetMsg = await invoke("greet", { name });
      files = await invoke("folder_details", {path: "/"});
      console.log('files');
      console.log(files);
    }
  </script>

  <div>
    <div class="row">
      <input id="greet-input" placeholder="Enter a name..." bind:value={name} />
      <button on:click={greet}>
        Greet
      </button>
    </div>
    <p>{greetMsg}</p>
  </div>

