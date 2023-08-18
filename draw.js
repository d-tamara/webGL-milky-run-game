// risanje objekta
var draw = function(object) {
	let prog = object.prog;
    var trala = 5;
	gl.useProgram(prog);

	let matWorldUniformLocation = gl.getUniformLocation(prog, 'mWorld');
	let matViewUniformLocation = gl.getUniformLocation(prog, 'mView');
	let matProjUniformLocation = gl.getUniformLocation(prog, 'mProj');
	let matNormalUniformLocation = gl.getUniformLocation(prog, 'mNormal');
	let vecAmbientColUniformLocation = gl.getUniformLocation(prog, 'vAmbientColor');
	let vecLightDirUniformLocation = gl.getUniformLocation(prog, 'vLightingDirection');
	let vecDirColUniformLocation = gl.getUniformLocation(prog, 'vDirectionalColor');
	let worldMatrix = new Float32Array(16);
	let viewMatrix = new Float32Array(16);
	let projMatrix = new Float32Array(16);
	let keybientlight = 0.25;
	let normalMatrix = new Float32Array(9);
	let ambientCol = new Float32Array([keybientlight, 0.25, 0.25]);
	let lightDir = new Float32Array([-0.2, -0.5, -0.4]);
	let dirCol = new Float32Array([0.7, 0.5, 0.5]);

	mat4.identity(worldMatrix);
	let cam = astronavtek.body.position;
	cam = [cam.x + camera.position[0],cam.y + camera.position[1],cam.z + camera.position[2]];//tukej se naredi mal offseta
	mat4.lookAt(viewMatrix, cam, [astronavtek.body.position.x,astronavtek.body.position.y + 1,astronavtek.body.position.z], [0, 1, 0]); //camera (pozicija kamere, kam gleda , vektor ki kaze gor)
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

	// transform
	let transformMatrix = new Float32Array(16);
	mat4.identity(transformMatrix);

	let pos = object.body.position;
	mat4.translate(transformMatrix, transformMatrix, [pos.x, pos.y, pos.z]);
	mat4.scale(transformMatrix, transformMatrix, object.scale);
	mat4.rotateX(transformMatrix, transformMatrix, glMatrix.toRadian(object.rotation[0]));
	mat4.rotateY(transformMatrix, transformMatrix, glMatrix.toRadian(object.rotation[1]));
	mat4.rotateZ(transformMatrix, transformMatrix, glMatrix.toRadian(object.rotation[2]));

	mat4.mul(worldMatrix, worldMatrix, transformMatrix);

	mat3.normalFromMat4(normalMatrix, worldMatrix); 

	let adjLightDir = vec3.create();
	vec3.normalize(adjLightDir, lightDir);
	vec3.scale(adjLightDir, adjLightDir, -1);

	//buffers
	gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.indexBuffer);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,object.gltexture);

	let positionAttribLocation = gl.getAttribLocation(prog, 'vertPosition');
	let normalAttribLocation = gl.getAttribLocation(prog, 'vertNormal');
	let texCoordAttribLocation = gl.getAttribLocation(prog, 'vertTexCoord');

	gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 8 * Float32Array.BYTES_PER_ELEMENT, 0);//5 namest 6 ker smo rgb zamenjal z uv koordinatam
	gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, gl.FALSE, 8 * Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);
	gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, gl.FALSE, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(normalAttribLocation);
	gl.enableVertexAttribArray(texCoordAttribLocation);

	//uniforms
	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
	gl.uniformMatrix3fv(matNormalUniformLocation, gl.FALSE, normalMatrix);
	gl.uniform3fv(vecAmbientColUniformLocation, ambientCol);
	gl.uniform3fv(vecLightDirUniformLocation, adjLightDir);
	gl.uniform3fv(vecDirColUniformLocation, dirCol);

	gl.drawElements(gl.TRIANGLES, object.indicesLen, gl.UNSIGNED_SHORT, 0);
};