<script>
// @ts-nocheck

    import { invoke } from "@tauri-apps/api/tauri";
    import { listen } from '@tauri-apps/api/event';
    import { open } from "@tauri-apps/api/dialog";
    import { getMatches } from '@tauri-apps/api/cli'
    import { onMount } from 'svelte';
    import Icon from "./Icon.svelte";
    import Toolbar from "./Toolbar.svelte";
    import { slide } from 'svelte/transition';

    let unlisten;
    let files = [];
    let path = '';
        /**
     * @type {any[]}
     */
    let currentPath = '';
    let selectFiles = [];

    const onLoad = async() => {
      unlisten = await listen('open_dialog', (event) => {
        console.log(event);
          let properties = {
            filters: [{
              extensions: ['zip', 'tar', 'rar'], name: "Compress Files"
            }]
          };
          open(properties).then(async (pathStr) => {
            path = pathStr;
            files = await invoke("read_compress_file", {path: pathStr, subPath: ""});
          });
      });
    }
    onMount(async () => {
      onLoad();
      const matches = await getMatches();
      path = matches.args.path.value ?? ".";
      files = await invoke("read_compress_file", {path, subPath: ""});
    });

    function beforeUnload() {
      unlisten();
    }

    /**
     * @param {string} subPath
     */
    async function getSubdir(event, subPath) {
        event.preventDefault();
        selectFiles = [];
        console.log(subPath);
        console.log(path);
        if (subPath.endsWith('/') || subPath === "") {
          files = await invoke("read_compress_file", { path, subPath});
          currentPath = subPath;
        } else {
          invoke('open_file', { path, file: subPath });
        }
    }

    async function upDirectory(event) {
        let arrayPath = currentPath.split('/');
        if (arrayPath[arrayPath.length-1] === '') {
            arrayPath.pop();
        }

        arrayPath.pop();
        let path = arrayPath.join('/');
        if (arrayPath.length){
            path += "/"
        }

        await getSubdir(event, path)
    }

    function selectFile(file) {
      if (selectFiles.indexOf(file) === -1) {
        selectFiles.push(file);
      } else {
        selectFiles.splice(selectFiles.indexOf(file), 1);
      }
      selectFiles = selectFiles;
    }

    async function onExtract() {
      await invoke('uncomporess_file', { path, files: selectFiles});
    }

  </script>
<svelte:window on:beforeunload={beforeUnload} />
  <Toolbar onExtract={onExtract} />
  <div class="block border-t-2 border-r-2 border-l-2 rounded-tl-lg rounded-tr-lg">
      <table class="w-full  hover:auto-rows-min h-100">
        <thead class="cursor-pointer h-8 content-center items-center border-b-2 w-full sticky top-4">
          <tr >
            <td class="pl-2">Name</td>
            <td class="w-12">Type</td>
            <td class="w-12">Size</td>
          </tr>
      </thead>
    </table>
  </div>
  <div class="h-[calc(100%_-_8rem)] block border-b-2 border-l-2 border-r-2 rounded-bl-lg rounded-br-lg overflow-y-auto">
    <table class="w-full hover:auto-rows-min h-100">
      <tbody class="h-100  top-16">
        {#if currentPath !== '' }
        <tr>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <td class="hover:bg-sky-200 cursor-pointer h-8" on:dblclick={(event) => upDirectory(event)} colspan="4">
            <div class="pl-2">..</div>
        </td>
      </tr>
        {/if}
        
        {#each files as file}
        <tr transition:slide 
          class="hover:bg-blue-200 cursor-pointer  h-8 content-center items-center {selectFiles.indexOf(file) !== -1 ? 'bg-blue-200' : 'odd:bg-gray-100'}" 
          on:dblclick={(event) => getSubdir(event, file)} 
          on:click={() => selectFile(file)}
          >
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            {#key file}
                <td class="pl-2 ">
                  <div class="flex">
                    <Icon bind:filename={file}/>
                    <div class="pl-1">
                    {file.replace(currentPath, "")}
                    </div>
                  </div>
                </td>
                <td class="w-12">--</td>
                <td class="w-12">--</td>
            {/key}
          </tr>
        {/each}
      </tbody>
      </table>
    </div>
