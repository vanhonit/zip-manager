<script>
    export let onExtract;

</script>
<div class="flex h-16 mb-2 content-center pt-2">
    <button  class="mr-2 text-center grid grid-rows-2 items-center justify-items-center hover:bg-gray-200 rounded p-2" >
        <div class="pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>                             
        </div>
        <div>
        <span>Add</span>
        </div>
        </button>
    <button class="mr-2 text-center grid grid-rows-2 items-center justify-items-center hover:bg-gray-200 rounded p-2" on:click={() => onExtract()}>
        <div class="pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
              </svg>              
        </div>
        <div>
            <span>Extract</span>
        </div>
    </button>
    <button   class="mr-2 text-center grid grid-rows-2 items-center justify-items-center hover:bg-gray-200 rounded p-2">    
        <div class="pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>              
        </div>
        <div>
            <span>View</span>
        </div>
        </button>
</div>