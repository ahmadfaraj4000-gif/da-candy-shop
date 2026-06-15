(function () {
  const canvas = document.getElementById("smokeCanvas");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance"
  });

  if (!gl) {
    canvas.style.background = "#000";
    return;
  }

  const smokeLayer = canvas.parentElement;
  const root = document.documentElement;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const sim = { width: 0, height: 0, read: 0, last: performance.now(), start: performance.now() };
  let viewWidth = 0;
  let viewHeight = 0;
  let dpr = 1;
  let textures = [];
  let framebuffers = [];

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const commonSource = `
    precision highp float;

    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform float u_time;
    uniform float u_dt;
    uniform sampler2D u_prev;

    float hash(vec2 p) {
      p = fract(p * vec2(127.1, 311.7));
      p += dot(p, p + 74.7);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.55;
      mat2 rot = mat2(0.78, -0.63, 0.63, 0.78);
      for (int i = 0; i < 5; i++) {
        value += amp * noise(p);
        p = rot * p * 2.03 + 19.1;
        amp *= 0.52;
      }
      return value;
    }

    vec2 curlVelocity(vec2 p, float t) {
      float e = 0.016;
      vec2 q = p * vec2(2.2, 1.35);
      float n1 = fbm(q + vec2(t * 0.08, -t * 0.22));
      float nx1 = fbm(q + vec2(e, 0.0) + vec2(t * 0.08, -t * 0.22));
      float nx2 = fbm(q - vec2(e, 0.0) + vec2(t * 0.08, -t * 0.22));
      float ny1 = fbm(q + vec2(0.0, e) + vec2(t * 0.08, -t * 0.22));
      float ny2 = fbm(q - vec2(0.0, e) + vec2(t * 0.08, -t * 0.22));
      vec2 curl = vec2(ny1 - ny2, -(nx1 - nx2)) / (2.0 * e);
      float roll = sin((p.y * 15.0 + n1 * 8.0) - t * 1.25);
      curl += vec2(roll * 0.18, sin(p.x * 12.0 + t * 0.4) * 0.08);
      return curl;
    }

    float sourcePulse(vec2 uv, vec2 source, float radius, float t, float seed) {
      vec2 p = uv - source;
      p.x += sin(t * 0.82 + seed) * 0.025;
      float body = exp(-dot(p, p) / (radius * radius));
      float pulse = 0.55 + 0.45 * smoothstep(0.18, 1.0, fbm(vec2(t * 0.18 + seed, seed * 2.3)));
      float broken = smoothstep(0.22, 0.94, fbm(p * 34.0 + vec2(seed, -t * 0.8)));
      return body * pulse * (0.74 + broken * 0.38);
    }
  `;

  const simFragmentSource = `
    ${commonSource}

    void main() {
      vec2 texel = 1.0 / u_resolution;
      vec2 uv = v_uv;
      vec2 pointerWind = u_pointer * vec2(-0.018, 0.01);

      vec2 velocity = curlVelocity(uv + pointerWind, u_time);
      float heightLift = smoothstep(0.0, 0.92, uv.y);
      velocity *= mix(0.0035, 0.011, heightLift);
      velocity += vec2(0.003 * sin(u_time * 0.08 + uv.y * 3.0), 0.006 + heightLift * 0.004);
      velocity += pointerWind * 0.08;

      vec2 back = uv - velocity * min(u_dt, 0.033);
      vec4 previous = texture2D(u_prev, clamp(back, vec2(0.0), vec2(1.0)));

      float density = previous.r * 0.956;
      float age = previous.g + u_dt * 0.03;

      float injection = 0.0;
      injection += sourcePulse(uv, vec2(0.18, 0.2), 0.24, u_time * 0.22, 1.3) * 0.006;
      injection += sourcePulse(uv, vec2(0.54, 0.34), 0.3, u_time * 0.18, 4.8) * 0.005;
      injection += sourcePulse(uv, vec2(0.82, 0.18), 0.23, u_time * 0.16, 9.6) * 0.0042;
      injection += smoothstep(0.62, 0.98, fbm(uv * vec2(3.2, 2.4) + vec2(u_time * 0.025, -u_time * 0.045))) * 0.0022;

      float column = smoothstep(0.0, 0.14, uv.y) * (1.0 - smoothstep(0.82, 1.0, uv.y));
      float turbulence = fbm(uv * vec2(9.0, 6.4) + vec2(u_time * 0.05, -u_time * 0.16));
      density += injection;
      density += density * smoothstep(0.74, 0.99, turbulence) * column * 0.0018;

      float sideFade = smoothstep(0.0, 0.04, uv.x) * (1.0 - smoothstep(0.96, 1.0, uv.x));
      float topFade = 1.0 - smoothstep(0.88, 1.0, uv.y);
      float bottomFade = smoothstep(0.0, 0.1, uv.y);
      density *= sideFade * bottomFade * mix(0.7, 1.0, topFade);
      density = clamp(density, 0.0, 0.42);

      gl_FragColor = vec4(density, age, 0.0, 1.0);
    }
  `;

  const renderFragmentSource = `
    ${commonSource}

    void main() {
      vec2 uv = v_uv;
      vec2 texel = 1.0 / u_resolution;
      float d = texture2D(u_prev, uv).r;
      float left = texture2D(u_prev, uv - vec2(texel.x, 0.0)).r;
      float right = texture2D(u_prev, uv + vec2(texel.x, 0.0)).r;
      float down = texture2D(u_prev, uv - vec2(0.0, texel.y)).r;
      float up = texture2D(u_prev, uv + vec2(0.0, texel.y)).r;

      float blur = (left + right + down + up + d * 4.0) * 0.125;
      float filament = fbm(uv * vec2(3.4, 4.8) + vec2(u_time * 0.006, -u_time * 0.018));
      float value = smoothstep(0.006, 0.36, blur) * (0.68 + filament * 0.16);
      value = pow(clamp(value, 0.0, 1.0), 1.45);

      vec3 smoke = vec3(value * 0.72);
      smoke = clamp(smoke, vec3(0.0), vec3(0.48));

      float vignette = smoothstep(1.0, 0.16, distance(uv, vec2(0.5)));
      smoke *= 0.58 + vignette * 0.32;

      gl_FragColor = vec4(smoke, 1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
    }
    return shader;
  }

  function createProgram(fragmentSource) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
    }
    return program;
  }

  let simProgram;
  let renderProgram;
  try {
    simProgram = createProgram(simFragmentSource);
    renderProgram = createProgram(renderFragmentSource);
  } catch (error) {
    console.warn(error);
    return;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  function getLocations(program) {
    return {
      position: gl.getAttribLocation(program, "a_position"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      time: gl.getUniformLocation(program, "u_time"),
      dt: gl.getUniformLocation(program, "u_dt"),
      prev: gl.getUniformLocation(program, "u_prev")
    };
  }

  const simLoc = getLocations(simProgram);
  const renderLoc = getLocations(renderProgram);

  function makeTexture(width, height) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
  }

  function makeFramebuffer(texture) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return framebuffer;
  }

  function bindProgram(program, locations) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;
    canvas.width = Math.floor(viewWidth * dpr);
    canvas.height = Math.floor(viewHeight * dpr);
    canvas.style.width = `${viewWidth}px`;
    canvas.style.height = `${viewHeight}px`;

    sim.width = Math.max(320, Math.floor(canvas.width * 0.56));
    sim.height = Math.max(220, Math.floor(canvas.height * 0.56));

    textures.forEach((texture) => gl.deleteTexture(texture));
    framebuffers.forEach((framebuffer) => gl.deleteFramebuffer(framebuffer));
    textures = [makeTexture(sim.width, sim.height), makeTexture(sim.width, sim.height)];
    framebuffers = textures.map(makeFramebuffer);
    sim.read = 0;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
    gl.viewport(0, 0, sim.width, sim.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function runPass(program, locations, target, texture, resolution, dt, time) {
    bindProgram(program, locations);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(locations.prev, 0);
    gl.uniform2f(locations.resolution, resolution[0], resolution[1]);
    gl.uniform2f(locations.pointer, pointer.x, pointer.y);
    gl.uniform1f(locations.time, time);
    gl.uniform1f(locations.dt, dt);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, resolution[0], resolution[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function render(now) {
    const time = (now - sim.start) * 0.001;
    const dt = Math.min((now - sim.last) * 0.001, 0.033);
    sim.last = now;

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    const write = 1 - sim.read;
    runPass(simProgram, simLoc, framebuffers[write], textures[sim.read], [sim.width, sim.height], dt, time);
    sim.read = write;
    runPass(renderProgram, renderLoc, null, textures[sim.read], [canvas.width, canvas.height], dt, time);

    smokeLayer.style.setProperty("--mx", pointer.x.toFixed(3));
    smokeLayer.style.setProperty("--my", pointer.y.toFixed(3));
    root.style.setProperty("--px", pointer.x.toFixed(3));
    root.style.setProperty("--py", pointer.y.toFixed(3));
    requestAnimationFrame(render);
  }

  function updatePointer(event) {
    pointer.tx = (event.clientX / Math.max(viewWidth, 1) - 0.5) * -1;
    pointer.ty = (event.clientY / Math.max(viewHeight, 1) - 0.5) * -1;
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  resize();
  requestAnimationFrame(render);
})();
